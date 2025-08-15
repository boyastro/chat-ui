// utils/awsSocket.js
// Tách toàn bộ logic WebSocket AWS ra file riêng

export class AwsChatSocket {
  constructor({
    url,
    userId,
    roomId,
    onMessage,
    onSystem,
    onOpen,
    onClose,
    onError,
  }) {
    this.url = url;
    this.userId = userId;
    this.roomId = roomId;
    this.onMessage = onMessage;
    this.onSystem = onSystem;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.ws = null;
  }

  connect() {
    if (this.ws) this.disconnect();
    this.ws = new window.WebSocket(this.url);
    this.ws.onopen = (event) => {
      this.onOpen && this.onOpen(event);
      // Gửi joinRoom ngay khi socket mở
      if (this.ws && this.ws.readyState === 1) {
        this.ws.send(
          JSON.stringify({
            action: "joinRoom",
            connectionId: null,
            userId: this.userId,
            roomId: this.roomId,
          })
        );
      }
    };
    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        msg = { system: true, message: event.data };
      }
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case "receiveMessage":
          if (
            msg.data &&
            typeof msg.data.user === "string" &&
            typeof msg.data.name === "string" &&
            typeof msg.data.message === "string" &&
            typeof msg.data.time === "string"
          ) {
            this.onMessage && this.onMessage({ ...msg.data, system: false });
          }
          break;
        case "joinRoomSuccess":
          if (
            msg.data &&
            typeof msg.data.userId === "string" &&
            typeof msg.data.roomId === "string" &&
            typeof msg.data.time === "string"
          ) {
            this.onSystem &&
              this.onSystem({
                system: true,
                message: `You have joined room: ${msg.data.roomId}`,
                time: msg.data.time,
              });
          }
          break;
        case "system":
          if (msg.data && typeof msg.data.message === "string") {
            this.onSystem &&
              this.onSystem({ system: true, message: msg.data.message });
          }
          break;
        case "userJoined":
          if (msg.data && typeof msg.data.name === "string") {
            this.onSystem &&
              this.onSystem({
                system: true,
                message: `${msg.data.name} joined the room`,
              });
          }
          break;
        case "userLeft":
          if (msg.data && typeof msg.data.name === "string") {
            this.onSystem &&
              this.onSystem({
                system: true,
                message: `${msg.data.name} left the room`,
              });
          }
          break;
        default:
          break;
      }
    };
    this.ws.onclose = (event) => {
      this.onClose && this.onClose(event);
    };
    this.ws.onerror = (err) => {
      this.onError && this.onError(err);
    };
  }

  send(payload) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
