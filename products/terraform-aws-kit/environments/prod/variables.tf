## environments/prod/variables.tf
variable "project"             { type = string; default = "shipkit" }
variable "aws_region"          { type = string; default = "eu-west-1" }
variable "vpc_cidr"            { type = string; default = "10.0.0.0/16" }
variable "availability_zones"  { type = list(string); default = ["eu-west-1a","eu-west-1b","eu-west-1c"] }
variable "public_subnet_cidrs" { type = list(string); default = ["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"] }
variable "private_subnet_cidrs"{ type = list(string); default = ["10.0.11.0/24","10.0.12.0/24","10.0.13.0/24"] }
variable "kubernetes_version"  { type = string; default = "1.30" }
variable "node_instance_types" { type = list(string); default = ["t3.large"] }
