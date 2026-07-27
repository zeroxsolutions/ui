output "d1_database_ids" {
  description = "Map of D1 database logical name to database ID - use in wrangler.jsonc"
  value       = { for key, db in cloudflare_d1_database.databases : key => db.id }
}

output "d1_databases" {
  description = "Map of D1 database logical name to { id, name }"
  value = {
    for key, db in cloudflare_d1_database.databases : key => {
      id   = db.id
      name = db.name
    }
  }
}

output "kv_namespace_ids" {
  description = "Map of KV namespace logical name to namespace ID - use in wrangler.jsonc"
  value       = { for key, kv in cloudflare_workers_kv_namespace.main : key => kv.id }
}

output "kv_namespaces" {
  description = "Map of KV namespace logical name to { id, title }"
  value = {
    for key, ns in cloudflare_workers_kv_namespace.main : key => {
      id    = ns.id
      title = ns.title
    }
  }
}

output "hyperdrive_config_ids" {
  description = "Map of Hyperdrive config logical name to config ID - use in wrangler.jsonc"
  value       = { for key, hd in cloudflare_hyperdrive_config.main : key => hd.id }
}

output "queue_ids" {
  description = "Map of Queue logical name to queue ID"
  value       = { for key, q in cloudflare_queue.main : key => q.id }
}

output "queues" {
  description = "Map of Queue logical name to { id, queue_name }"
  value = {
    for key, q in cloudflare_queue.main : key => {
      id         = q.id
      queue_name = q.queue_name
    }
  }
}

output "r2_bucket_names" {
  description = "Map of R2 bucket logical name to full bucket name"
  value       = { for key, b in cloudflare_r2_bucket.main : key => b.name }
}

output "pages_projects" {
  description = "Map of Pages project logical_key => { subdomain, domains }"
  value = {
    for key, p in cloudflare_pages_project.this : key => {
      subdomain = p.subdomain
      domains   = p.domains
    }
  }
}

output "r2_buckets" {
  description = "Map of R2 bucket logical name to { name }"
  value = {
    for key, b in cloudflare_r2_bucket.main : key => {
      name = b.name
    }
  }
}

output "r2_custom_domains" {
  description = "Map of R2 custom domain logical name to its public HTTPS URL"
  value = {
    for key, c in cloudflare_r2_custom_domain.main : key => "https://${c.domain}"
  }
}

output "ai_gateways" {
  description = "AI Gateway ids keyed by logical name - bind via AI_GATEWAY_ID in wrangler"
  value       = { for name, g in cloudflare_ai_gateway.main : name => g.id }
}

output "ai_gateway_run_token" {
  value       = try(cloudflare_api_token.ai_gateway_run[0].value, "")
  sensitive   = true
  description = "cf-aig-authorization bearer for Unified Billing -> api worker secret CF_AIG_TOKEN. Empty until ai_gateway_run_permission_group_id is set."
}

output "realtime_sfu_app_id" {
  description = "The rooms Realtime SFU app id (its uid) - the public REALTIME_APP_ID var in rooms-service wrangler.jsonc"
  value       = cloudflare_calls_sfu_app.rooms.uid
}

output "realtime_sfu_app_secret" {
  description = "The rooms Realtime SFU app secret - set as REALTIME_APP_SECRET via wrangler secret put (never in vars)"
  sensitive   = true
  value       = cloudflare_calls_sfu_app.rooms.secret
}
