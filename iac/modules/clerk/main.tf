terraform {
  required_providers {
    clerk = {
      source  = "buildwithdeck/clerk"
      version = "~> 0.7"
    }
  }
}

# Two keys, two APIs. `api_key` (instance secret key, sk_test_/sk_live_) drives the
# Backend API resources in instance.tf; `platform_api_key` (ak_) drives the Platform
# API resources in applications.tf (clerk_application / clerk_domain /
# clerk_instance_config). Both are optional at the provider level, so when no Clerk
# resources are declared (a product using Firebase instead) the provider is never
# invoked and null creds are harmless. The Platform API is a Clerk beta; enable it
# on the account before applying applications.tf.
provider "clerk" {
  api_key          = var.api_key
  platform_api_key = var.platform_api_key
}
