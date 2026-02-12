# Vercel Configuration Quick Reference Card

## 🎯 Your Current Setup

```json
{
  "projects": {
    "pelicanstate-pm": {
      "rootDirectory": "PelicanState/PM Dashboard/app",
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "framework": "vite",
      "installCommand": "npm install"
    }
  }
}
```

**What it means:**
- `rootDirectory`: Where Vercel should look for your app
- `buildCommand`: How to build the app (runs from rootDirectory)
- `outputDirectory`: Where built files go (relative to rootDirectory)
- `framework`: Type of framework (Vite for your React app)

---

## ❌ Common Mistakes & ✅ How to Avoid Them

| Mistake | Why Wrong | Fix |
|---------|-----------|-----|
| `"cd 'path with spaces' && npm build"` | Single quotes don't escape in shell | Use rootDirectory instead |
| No `rootDirectory` specified | Vercel doesn't know where app is | Add rootDirectory field |
| `outputDirectory: "absolute/path"` | Path is relative to rootDirectory | Remove leading slashes |
| `buildCommand: "npm install && npm build"` | Install happens automatically | Just use `npm run build` |
| No `vercel.json` file | Vercel uses defaults (root) | Create vercel.json |

---

## 🚀 Deployment Checklist

Before pushing to GitHub:

- [ ] `vercel.json` uses monorepo format
- [ ] `rootDirectory` is correct path to your app
- [ ] `package.json` exists at `rootDirectory`
- [ ] `npm run build` works locally
- [ ] `dist/` folder created after build
- [ ] `dist/index.html` exists
- [ ] No hardcoded absolute paths in build

---

## 🔍 Debugging the 404 Error

1. **Check build time in Vercel logs**
   - `105ms` = too fast (build didn't run)
   - `30+ seconds` = proper build

2. **Look for index.html**
   - Should see: `dist/index.html 0.45 kB`
   - If missing: build didn't complete

3. **Verify rootDirectory path**
   ```bash
   ls "PelicanState/PM Dashboard/app/package.json"
   # Should exist
   ```

4. **Test locally**
   ```bash
   cd "PelicanState/PM Dashboard/app"
   npm run build
   ls dist/index.html  # Must exist
   ```

---

## 📊 Vercel Build Process Flow

```
GitHub Push
    ↓
Vercel detects change
    ↓
Reads vercel.json
    ↓
Sets rootDirectory
    ↓
Runs installCommand (npm install)
    ↓
Runs buildCommand (npm run build)
    ↓
Looks for outputDirectory/index.html
    ↓
Deploys if found ✅
Shows 404 if NOT found ❌
```

---

## 💡 Quick Reference: Configuration Formats

### ❌ OLD FORMAT (Doesn't work with spaces)
```json
{
  "buildCommand": "cd 'path with spaces' && npm build",
  "outputDirectory": "path/with/spaces/dist"
}
```

### ✅ NEW FORMAT (What you're using)
```json
{
  "projects": {
    "app-name": {
      "rootDirectory": "path/with/spaces",
      "buildCommand": "npm build",
      "outputDirectory": "dist"
    }
  }
}
```

---

## 🆘 If Still Getting 404

1. Check Vercel dashboard build logs for errors
2. Run `npm run build` locally to verify
3. Check that rootDirectory path is correct
4. Verify vercel.json syntax is valid JSON
5. Wait 2+ minutes for Vercel to detect changes
6. Try manual redeploy in Vercel dashboard

---

## 📚 Related Files in Your Repo

- `vercel.json` - Deployment configuration
- `VERCEL_NOT_FOUND_FIX.md` - Complete error analysis
- `PelicanState/PM Dashboard/app/package.json` - App config
- `PelicanState/PM Dashboard/app/vite.config.ts` - Build config

---

**Status:** ✅ Fixed  
**Format:** Monorepo (Best Practice)  
**Last Updated:** February 12, 2026
