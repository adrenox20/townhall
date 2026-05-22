export class IssueRoom {
  constructor(private state: DurableObjectState) {}
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/broadcast')) return new Response(JSON.stringify({ ok: true }));
    return new Response(JSON.stringify({ room: this.state.id.toString() }), { headers: { 'content-type': 'application/json' } });
  }
}
