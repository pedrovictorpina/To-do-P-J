import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀 To-Do API</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '600px' }}>
        API REST para gerenciamento de to-dos com compartilhamento entre usuários.
        <br />
        Construída com Next.js + TypeScript + Supabase.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/api-docs"
          style={{
            padding: '1rem 2rem',
            background: 'white',
            color: '#667eea',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            transition: 'transform 0.2s',
          }}
        >
          📖 Documentação Swagger
        </Link>
      </div>

      <div
        style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          maxWidth: '500px',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Endpoints Disponíveis</h2>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
          <li>✅ POST /api/auth/signup - Registro</li>
          <li>✅ POST /api/auth/signin - Login</li>
          <li>✅ POST /api/auth/signout - Logout</li>
          <li>✅ GET /api/auth/me - Dados do usuário</li>
          <li>✅ CRUD /api/todos - Gerenciar to-dos</li>
          <li>✅ /api/todos/:id/share - Compartilhar</li>
          <li>✅ GET /api/todos/shared - To-dos compartilhados</li>
        </ul>
      </div>
    </main>
  )
}
