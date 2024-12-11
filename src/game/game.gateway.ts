import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TicketService } from '../ticket/ticket.service';
import { Ticket, TicketClaimType } from '../ticket/interfaces/iTicket.service';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  users: { [socketId: string]: string } = {};
  winners: { [claimType: string]: string } = {};
  tickets: { [username: string]: Ticket } = {};
  numbersDrawn: number[] = [];

  constructor(private readonly ticketService: TicketService) {}

  handleConnection(client: Socket): void {
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
    const ticket = this.ticketService.generateTicket(username);
    this.tickets[username] = ticket;
    client.emit('ticketGenerated', ticket);
    this.server.emit('userJoined', username);
  }

  @SubscribeMessage('claimTicket')
  handleClaimTicket(client: Socket, data: { username: string, claimType: TicketClaimType }): void {
    const ticket = this.tickets[data.username];
    if (!ticket) {
      return;
    } else if (this.winners[data.claimType]) {
      client.to(client.id).emit('socketErr', { 
        message: `${data.claimType} has already been claimed by ${this.winners[data.claimType]}`
      });
      return;
    }
    const isVerified = this.ticketService.verifyTicket(data.username, data.claimType, this.numbersDrawn);
    if (isVerified) {
      this.winners[data.claimType] = data.username;
      this.server.emit('winnerAnnounced', { username: data.username, claimType: data.claimType });
    } else {
      this.server.to(client.id).emit('socketErr', { message: `${data.claimType.toString()} is not valid` });
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(): void {
    this.numbersDrawn = [];
    this.winners = {}; // Clear previous winners
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
