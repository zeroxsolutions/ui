terraform {
  required_providers {
    neon = {
      source = "kislerdm/neon"
    }
    time = {
      source = "hashicorp/time"
    }
  }
}

provider "neon" {
  api_key = var.api_key
}
