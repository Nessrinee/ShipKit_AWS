variable "name" { type = string }

variable "repositories" {
  type    = list(string)
  default = ["backend", "frontend"]
}

variable "keep_images" {
  type    = number
  default = 10
}

variable "force_delete" {
  type        = bool
  default     = false
  description = "Allow destroy even when images exist (dev and test only)"
}