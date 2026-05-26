# Minerva Foods Global FAQ

Aplicacao Next.js para FAQ corporativo dos escritorios internacionais da Minerva Foods.

## Recursos

- Acesso permitido apenas para e-mails `@minervafoods.com`.
- Login e cadastro via Supabase Auth.
- Perfil `admin` ou `user` definido no servidor pela variavel `ADMIN_EMAILS`.
- Area do colaborador com fluxo `Tema -> Perguntas provaveis -> Resposta oficial`.
- Admin para cadastrar temas, perguntas e respostas em Portugues, Ingles e Espanhol.
- Relatorios de uso por sessoes, temas, perguntas acessadas, idiomas e feedback.
- Identidade visual Minerva Foods com logo oficial em `public/logo-minerva.webp`.

## Variaveis de ambiente na Vercel

Configure em Project Settings -> Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=seu.email@minervafoods.com,outro.admin@minervafoods.com
```

## Supabase

1. Abra o SQL Editor no Supabase.
2. Execute o arquivo `supabase/migrations/001_initial_schema.sql`.
3. Confirme que Auth esta habilitado para e-mail/senha.
4. Garanta que os administradores estejam listados em `ADMIN_EMAILS`.

## Deploy na Vercel

- Framework Preset: Next.js.
- Build Command: `npm run build`.
- Install Command: `npm install`.
- Output Directory: deixe vazio.

O projeto foi ajustado para dependencias estaveis e removeu o `package-lock.json` antigo que apontava para versoes incorretas.
