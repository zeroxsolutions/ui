# Vectorize indexes.
# The Cloudflare Terraform provider v5.18 has no native Vectorize resource, so
# creation is shelled out to the wrangler CLI. State holds only the input
# trigger - CF is the source of truth for index existence.

resource "terraform_data" "vectorize_indexes" {
  for_each = { for idx in var.vectorize_indexes : idx.name => idx }

  input = {
    name       = each.value.name
    dimensions = each.value.dimensions
    metric     = each.value.metric
  }

  provisioner "local-exec" {
    command = "pnpm dlx wrangler@latest vectorize create '${self.input.name}' --dimensions=${self.input.dimensions} --metric=${self.input.metric}"
    environment = {
      CLOUDFLARE_API_TOKEN  = var.api_token
      CLOUDFLARE_ACCOUNT_ID = var.account_id
    }
  }

  provisioner "local-exec" {
    when    = destroy
    command = "pnpm dlx wrangler@latest vectorize delete '${self.input.name}' -y || true"
  }
}
