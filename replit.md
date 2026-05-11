# Braw Messenger

Braw, Firebase tabanlı gerçek zamanlı mesajlaşma uygulamasıdır. Bireysel ve grup sohbetleri, sesli arama, dosya/fotoğraf paylaşımı ve kapsamlı admin paneli içerir.

## Run & Operate

- `pnpm --filter @workspace/braw run dev` — Expo uygulamasını çalıştır
- `pnpm --filter @workspace/api-server run dev` — API sunucusunu çalıştır (port 5000)
- `pnpm run typecheck` — Tüm paketleri type-check et
- Required env: `DATABASE_URL` — Postgres bağlantı dizisi (API server için)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) + Expo Router
- Backend: Firebase (Auth, Firestore, Storage)
- State: React Context + React Query
- API: Express 5 (api-server)

## Where things live

- `artifacts/braw/` — Expo mobil uygulama
- `artifacts/braw/services/firebase.ts` — Firebase config
- `artifacts/braw/services/chatService.ts` — Sohbet/grup işlemleri
- `artifacts/braw/services/adminService.ts` — Admin işlemleri
- `artifacts/braw/context/AuthContext.tsx` — Authentication state
- `artifacts/braw/app/(auth)/` — Giriş/Kayıt ekranları
- `artifacts/braw/app/(tabs)/` — Ana sekmeler (Sohbetler, Gruplar, Ara, Profil)
- `artifacts/braw/app/chat/[id].tsx` — Bireysel sohbet
- `artifacts/braw/app/group/[id].tsx` — Grup sohbeti
- `artifacts/braw/app/admin/` — Admin paneli
- `artifacts/braw/app/voice-call/[id].tsx` — Sesli arama ekranı

## Architecture decisions

- Firebase Firestore gerçek zamanlı dinleyiciler (onSnapshot) kullanılıyor — polling yok
- Admin paneli sadece `isAdmin: true` kullanıcılara görünür
- Mavi tik = `verified: "blue"`, Siyah tik = `verified: "black"` — admin tarafından verilir
- Dosya/fotoğraf paylaşımı Firebase Storage üzerinden yapılıyor
- Sesli arama UI simüle edilmiş — gerçek WebRTC için native build gerekir

## Product

- Kayıt: İsim, kullanıcı adı, e-posta, şifre
- Sohbet: Bireysel mesajlaşma, grup mesajlaşma
- Medya: Fotoğraf gönderme, dosya gönderme
- Arama: Kullanıcı adıyla kullanıcı bulma
- Sesli Arama: Arama UI (tam WebRTC için native build gerekir)
- Admin Panel: Mavi/siyah tik verme, mesaj okuma, banlama/kaldırma

## User preferences

- Uygulama adı: Braw
- Paket adı: com.braw.tr
- Dil: Türkçe UI
- Firebase project: braw-te

## Gotchas

- Admin hesabı oluşturmak için Firestore'da kullanıcı dökümanında `isAdmin: true` ayarla
- Firebase Storage ve Firestore kuralları production'da ayarlanmalı
- expo-document-picker ve expo-file-system versiyonları uyarısı var — uyumluluk için güncellenebilir

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
