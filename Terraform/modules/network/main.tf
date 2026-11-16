locals {
    public_subnets = {for i, az in var.azs : az => cidrsubnet(var.vpc_cidr, 8, i) }
    private_subnets = {for i, az in var.azs : az => cidrsubnet(var.vpc_cidr, 8, i + 10)}
    nat_azs = var.single_nat_gateway ? [var.azs[0]] : var.azs
}