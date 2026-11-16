variable "name" {
    type= string
}
variable "vpc_cidr" {
    type = string
}
variable "azs" {
    type = list(string)

}
variable "cluster_name" {
    type = string
  
}
variable "single_nat_gateway" {
  type        = bool
  default     = true
  description = "One shared NAT (cheap, dev/test) or one per AZ (production HA)"
}