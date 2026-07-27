terraform {
  required_providers {
    stripe = {
      source  = "lukasaron/stripe"
      version = "~> 2"
    }
  }
}

provider "stripe" {
  api_key = var.api_key
}
