export class NotificationHub {
  constructor(private state: DurableObjectState) {}
  async fetch() {
    return new Response(JSON.stringify({ hub: this.state.id.toString() }), { headers: { 'content-type': 'application/json' } });
  }
}
