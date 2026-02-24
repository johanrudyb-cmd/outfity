# 🔑 Variables d'Environnement à Configurer dans Vercel

*Guide complet pour configurer toutes les variables nécessaires*

---

## 📍 Où Configurer

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet
3. **Settings** → **Environment Variables**
4. Ajouter chaque variable ci-dessous
5. **IMPORTANT** : Sélectionner **Production**, **Preview**, et **Development** pour chaque variable

---

## 🔴 OBLIGATOIRES (Sans ça, l'app ne fonctionne pas)

### 1. Base de Données
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[NUMBER]-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=10&statement_cache_size=0
```
**Où trouver** : 
- Supabase : Dashboard → Settings → Database → Connection String
- **IMPORTANT** : Utiliser **"Session pooler"** (pas "Direct connection")
- **Port** : **6543** (pas 5432)
- Format : `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[NUMBER]-[REGION].pooler.supabase.com:6543/postgres`

**⚠️ CRITIQUE** : 
- Sans ça, l'app ne peut pas démarrer
- Utiliser le **Session Pooler** (port 6543) pour éviter les problèmes de connexion
- Voir `docs/CONFIGURATION-SUPABASE.md` pour plus de détails

---

### 2. Authentification
```env
NEXTAUTH_SECRET=votre-secret-fort-minimum-32-caracteres
```
**Comment générer** :
```bash
# Sur Mac/Linux
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**OU** utiliser un générateur en ligne : https://generate-secret.vercel.app/32

**⚠️ CRITIQUE** : Minimum 32 caractères, garder secret

---

```env
NEXTAUTH_URL=https://votre-domaine.vercel.app
```
**Pour Production** : `https://outfity.fr` (ou votre domaine)
**Pour Preview** : `https://votre-projet-xxx.vercel.app`

**⚠️ CRITIQUE** : URL exacte de votre app (sans slash final)

---

## 🟡 IMPORTANTES (Sans ça, certaines fonctionnalités ne marchent pas)

### 3. OpenAI / ChatGPT
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**OU**
```env
CHATGPT_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Où trouver** : https://platform.openai.com/api-keys

**Impact** : Design Studio (Tech Pack) et UGC Lab (Scripts) ne fonctionneront pas sans ça

---

### 4. Ideogram (Flat Sketches)
```env
IDEogram_API_KEY=votre-cle-ideogram
```
**Où trouver** : https://developer.ideogram.ai/

**Impact** : Génération de flat sketches dans Design Studio ne fonctionnera pas

---

### 5. Higgsfield (Mockups & Virtual Try-On)
```env
HIGGSFIELD_API_KEY=votre-cle-higgsfield
HIGGSFIELD_API_SECRET=votre-secret-higgsfield
```
**Où trouver** : https://cloud.higgsfield.ai/dashboard

**Impact** : Mockups et Virtual Try-On ne fonctionneront pas sans ça

---

### 6. CRON Secret
```env
CRON_SECRET=votre-secret-cron-minimum-32-caracteres
```
**Comment générer** : Même méthode que `NEXTAUTH_SECRET` (voir ci-dessus)

**Impact** : Jobs CRON automatiques ne fonctionneront pas

---

## 🟢 OPTIONNELLES (Recommandées pour meilleure qualité)

### 7. Anthropic Claude (Analyses longues)
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Où trouver** : https://console.anthropic.com/

**Impact** : Si non configuré, fallback sur GPT-4. Claude donne de meilleurs résultats pour analyses longues.

---

### 8. URL de l'Application
```env
NEXT_PUBLIC_APP_URL=https://outfity.fr
```
**Pour Production** : `https://outfity.fr` (ou votre domaine)
**Pour Preview** : `https://votre-projet-xxx.vercel.app`

**Impact** : Métadonnées Open Graph, redirections Stripe

---

### 9. Node Environment
```env
NODE_ENV=production
```
**Pour Production** : `production`
**Pour Preview** : `production` (aussi)
**Pour Development** : `development` (local uniquement)

---

## 🔵 OPTIONNELLES (Fonctionnalités avancées)

### 10. SMTP (Emails avec tech pack en PJ)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=noreply@outfity.fr
```
**Impact** : Si non configuré, utilise `mailto:` + téléchargement direct

---

### 11. Stripe (Paiements)
```env
STRIPE_SECRET_KEY=votre_cle_secrete_stripe_commence_par_sk_test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre_cle_publique_stripe_commence_par_pk_test
STRIPE_WEBHOOK_SECRET=votre_secret_webhook_stripe_commence_par_whsec
```
**Où trouver** : https://dashboard.stripe.com/apikeys

**Impact** : Paiements et abonnements ne fonctionneront pas sans ça

---

### 12. Brandfetch (Logos marques)
```env
BRANDFETCH_CLIENT_ID=votre-client-id
```
**Où trouver** : https://developers.brandfetch.com (gratuit)

**Impact** : Logos des marques non curatées lors de l'analyse

---

### 13. APIs Brand Spy (Données réelles - Payantes)
```env
# SimilarWeb (199€/mois) - Trafic réel
SIMILARWEB_API_KEY=votre-cle-similarweb

# Wappalyzer (49€/mois) - Détection apps précise
WAPPALYZER_API_KEY=votre-cle-wappalyzer

# Ahrefs (99€/mois) - Analyse SEO
AHREFS_API_KEY=votre-cle-ahrefs
AHREFS_API_SECRET=votre-secret-ahrefs

# BuiltWith (295€/mois) - Stack technique
BUILTWITH_API_KEY=votre-cle-builtwith
```
**Impact** : Si non configuré, données estimées au lieu de données réelles

---

### 14. URLs Publiques
```env
# Lien d'affiliation Shopify
NEXT_PUBLIC_SHOPIFY_AFFILIATE_URL=https://shopify.pxf.io/VOyg9a

# Groupe Instagram
NEXT_PUBLIC_INSTAGRAM_GROUP_URL=https://instagram.com/groups/xxx
```

---

## ✅ Checklist de Configuration

### OBLIGATOIRES
- [ ] `DATABASE_URL` configuré (Production + Preview)
- [ ] `NEXTAUTH_SECRET` configuré (Production + Preview) - 32+ caractères
- [ ] `NEXTAUTH_URL` configuré (Production + Preview) - URL exacte

### IMPORTANTES
- [ ] `OPENAI_API_KEY` ou `CHATGPT_API_KEY` configuré
- [ ] `IDEogram_API_KEY` configuré
- [ ] `HIGGSFIELD_API_KEY` configuré
- [ ] `HIGGSFIELD_API_SECRET` configuré
- [ ] `CRON_SECRET` configuré (32+ caractères)

### OPTIONNELLES (Recommandées)
- [ ] `ANTHROPIC_API_KEY` configuré (pour meilleure qualité)
- [ ] `NEXT_PUBLIC_APP_URL` configuré
- [ ] `NODE_ENV=production` configuré

### OPTIONNELLES (Avancées)
- [ ] SMTP configuré (si emails nécessaires)
- [ ] Stripe configuré (si paiements nécessaires)
- [ ] Brandfetch configuré (si logos nécessaires)
- [ ] APIs Brand Spy configurées (si données réelles nécessaires)

---

## 🚨 Erreurs Courantes

### ❌ "DATABASE_URL not found"
**Solution** : Vérifier que `DATABASE_URL` est bien configuré dans Vercel (Production ET Preview)

### ❌ "NEXTAUTH_SECRET not configured"
**Solution** : Vérifier que `NEXTAUTH_SECRET` est configuré et fait au moins 32 caractères

### ❌ "Clé API OpenAI non configurée"
**Solution** : Vérifier que `OPENAI_API_KEY` ou `CHATGPT_API_KEY` est configuré

### ❌ "Clés API Higgsfield non configurées"
**Solution** : Vérifier que `HIGGSFIELD_API_KEY` ET `HIGGSFIELD_API_SECRET` sont configurés

### ❌ Cookie non créé après connexion
**Solution** : Vérifier que `NEXTAUTH_URL` correspond exactement à l'URL de votre app (sans slash final)

---

## 📝 Exemple de Configuration Complète

```env
# OBLIGATOIRES
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
NEXTAUTH_SECRET=votre_secret_aleatoire_32_caracteres_minimum
NEXTAUTH_URL=https://outfity.fr

# IMPORTANTES
OPENAI_API_KEY=sk-proj-votre_cle_openai_ici
IDEogram_API_KEY=votre_cle_ideogram_ici
HIGGSFIELD_API_KEY=votre_cle_higgsfield_ici
HIGGSFIELD_API_SECRET=votre_secret_higgsfield_ici
CRON_SECRET=votre_secret_cron_32_caracteres_minimum

# OPTIONNELLES (Recommandées)
ANTHROPIC_API_KEY=sk-ant-votre_cle_anthropic_ici
NEXT_PUBLIC_APP_URL=https://outfity.fr
NODE_ENV=production
```

---

## 🔄 Après Configuration

1. **Redéployer** l'application sur Vercel
2. **Vérifier les logs** Vercel pour s'assurer qu'il n'y a pas d'erreurs
3. **Tester la connexion** sur l'app déployée
4. **Exécuter le seed** : `npm run seed:production` (après déploiement)

---

## 📞 Support

Si vous avez des problèmes :
1. Vérifier les logs Vercel (Deployments → Logs)
2. Vérifier que toutes les variables OBLIGATOIRES sont configurées
3. Vérifier que les valeurs sont correctes (pas de placeholders)
4. Redéployer après chaque modification de variable

---

---

## 🔄 n8n (Optionnel - Automatisation Workflows)

### Variables n8n

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `N8N_WEBHOOK_URL` | URL de base pour les webhooks n8n | `https://votre-instance.n8n.cloud/webhook` | Non |
| `N8N_API_URL` | URL de l'API n8n (si utilisation API) | `https://votre-instance.n8n.cloud` | Non |
| `N8N_API_KEY` | Clé API n8n (si utilisation API) | `n8n_api_xxxxx` | Non |
| `N8N_WEBHOOK_SECRET` | Secret pour authentifier les webhooks entrants | `votre_secret_aleatoire` | Non |

**Note** : Ces variables sont optionnelles. Voir `docs/INTEGRATION-N8N.md` pour plus d'informations.

---

**Une fois toutes les variables OBLIGATOIRES et IMPORTANTES configurées, l'app sera fonctionnelle !** 🎉
