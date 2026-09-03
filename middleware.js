export const config = { matcher: '/:path*' };

export default function middleware(request) {
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/markdown')) {
    return new Response('# MIDDLEWARE OK\n', {
      headers: { 'content-type': 'text/markdown; charset=utf-8' },
    });
  }
  // Sin Accept de markdown: no devolver nada = seguir al manejo normal.
}
