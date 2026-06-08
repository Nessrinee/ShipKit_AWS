# modules/vpc/main.tf — Production AWS VPC
# Multi-AZ: public + private subnets, single/multi NAT gateway

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

locals {
  common_tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}

# ── VPC ─────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, { Name = "${var.project}-${var.environment}-vpc" })
}

# ── Internet Gateway ─────────────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project}-${var.environment}-igw" })
}

# ── Public Subnets ───────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                     = "${var.project}-${var.environment}-public-${count.index + 1}"
    "kubernetes.io/role/elb" = "1"
  })
}

# ── Private Subnets ──────────────────────────────────────────────────
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name                              = "${var.project}-${var.environment}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb" = "1"
  })
}

# ── NAT Gateways ─────────────────────────────────────────────────────
# Single NAT for non-prod, one per AZ for prod (HA)
resource "aws_eip" "nat" {
  count  = var.single_nat_gateway ? 1 : length(var.availability_zones)
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "${var.project}-${var.environment}-eip-${count.index + 1}" })
}

resource "aws_nat_gateway" "main" {
  count         = var.single_nat_gateway ? 1 : length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = merge(local.common_tags, { Name = "${var.project}-${var.environment}-nat-${count.index + 1}" })
  depends_on    = [aws_internet_gateway.main]
}

# ── Route Tables ──────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${var.project}-${var.environment}-rt-public" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = var.single_nat_gateway ? 1 : length(var.availability_zones)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = merge(local.common_tags, { Name = "${var.project}-${var.environment}-rt-private-${count.index + 1}" })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : count.index].id
}

# ── VPC Flow Logs (security best practice) ───────────────────────────
resource "aws_flow_log" "main" {
  count           = var.enable_flow_logs ? 1 : 0
  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  tags            = local.common_tags
}

resource "aws_cloudwatch_log_group" "flow_log" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/${var.project}-${var.environment}"
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.project}-${var.environment}-vpc-flow-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow",
      Principal = { Service = "vpc-flow-logs.amazonaws.com" } }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log" {
  count  = var.enable_flow_logs ? 1 : 0
  name   = "flow-log-policy"
  role   = aws_iam_role.flow_log[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents","logs:DescribeLogGroups","logs:DescribeLogStreams"]
      Resource = "*"
    }]
  })
}
