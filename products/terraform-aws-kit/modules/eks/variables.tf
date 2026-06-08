## modules/eks/variables.tf
variable "project"             { type = string }
variable "environment"         { type = string }
variable "private_subnet_ids"  { type = list(string) }
variable "kubernetes_version"  { type = string; default = "1.30" }
variable "node_instance_types" { type = list(string); default = ["t3.medium"] }
variable "node_desired"        { type = number; default = 2 }
variable "node_min"            { type = number; default = 1 }
variable "node_max"            { type = number; default = 5 }
variable "public_access"       { type = bool; default = false }
variable "public_access_cidrs" { type = list(string); default = [] }
variable "tags"                { type = map(string); default = {} }
