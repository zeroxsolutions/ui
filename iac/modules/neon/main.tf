terraform {
  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.14"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.14"
    }
  }
}

provider "neon" {
  api_key = var.api_key
}
