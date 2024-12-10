import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TicketService } from '../ticket/ticket.service';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  users: { [socketId: string]: string } = {};
  tickets: { [username: string]: number[][] } = {};
  numbersDrawn: number[] = [];

  constructor(private readonly ticketService: TicketService) {}

  handleConnection(client: Socket): void {
    // Send the list of currently joined users and their tickets to the new user
    client.emit('joinedUsers', Object.values(this.users));
  }

  handleDisconnect(client: Socket): void {
    const username = this.users[client.id];
    if (username) {
      delete this.users[client.id];
      delete this.tickets[username];
      this.server.emit('userLeft', username);
    }
  }

  @SubscribeMessage('enterUsername')
  handleEnterUsername(client: Socket, username: string): void {
    this.users[client.id] = username;
    const ticket = this.ticketService.generateTicket();
    this.tickets[username] = ticket;
    client.emit('ticketGenerated', ticket);
    this.server.emit('userJoined', username);
  }

  @SubscribeMessage('claimTicket')
  handleClaimTicket(client: Socket, data: { username: string, claimType: string }): void {
    const ticket = this.tickets[data.username];
    const isVerified = this.ticketService.verifyTicket(ticket, data.claimType);
    if (isVerified) {
      this.server.emit('winnerAnnounced', { username: data.username, claimType: data.claimType });
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(): void {
    this.numbersDrawn = [];
    this.server.emit('gameStarted');
  }

  @SubscribeMessage('drawNumber')
  handleDrawNumber(): void {
    let num: number;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (this.numbersDrawn.includes(num));
    this.numbersDrawn.push(num);
    this.server.emit('numberDrawn', num);
  }
}
