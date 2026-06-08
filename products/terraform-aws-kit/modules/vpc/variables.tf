## modules/vpc/variables.tf
variable "project"     { type = string }
variable "environment" { type = string }
variable "vpc_cidr"    { type = string; default = "10.0.0.0/16" }

variable "availability_zones" {
  type    = list(string)
  default = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}
variable "public_subnet_cidrs"  { type = list(string); default = ["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"] }
variable "private_subnet_cidrs" { type = list(string); default = ["10.0.11.0/24","10.0.12.0/24","10.0.13.0/24"] }
variable "single_nat_gateway"   { type = bool; default = false }
variable "enable_flow_logs"     { type = bool; default = true }
variable "tags"                 { type = map(string); default = {} }
