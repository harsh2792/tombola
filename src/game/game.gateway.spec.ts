import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { TicketService } from '../ticket/ticket.service';
import { Ticket, TicketClaimType } from '../ticket/interfaces/iTicket.service';
import { Server, Socket } from 'socket.io';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let ticketService: TicketService;
  let server: Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameGateway, {
        provide: TicketService,
        useValue: {
          verifyTicket: jest.fn(),
          generateTicket: jest.fn()
        },
      }],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    ticketService = module.get<TicketService>(TicketService);
    server = new Server();
    gateway.server = server;
    jest.spyOn(server, 'emit');
  });

  it('should handle connection', () => {
    const client: Socket = { emit: jest.fn() } as any;
    gateway.handleConnection(client);
    expect(client.emit).toHaveBeenCalledWith('joinedUsers', []);
  });

  it('should handle disconnect', () => {
    const client: Socket = { id: '123', emit: jest.fn() } as any;
    gateway.users['123'] = 'testUser';
    gateway.handleDisconnect(client);
    expect(gateway.users['123']).toBeUndefined();
  });

  it('should handle enter username', () => {
    const client: Socket = { id: '123', emit: jest.fn() } as any;
    const ticket: Ticket = [
      [4, 16, '_', '_', 48, '_', 63, 76, '_'],
      [7, '_', 23, 38, '_', 52, '_', '_', 80],
      [9, '_', 25, '_', '_', 56, 64, '_', 83]
    ];
    jest.spyOn(ticketService, 'generateTicket').mockReturnValue(ticket);
    gateway.handleEnterUsername(client, 'testUser');
    expect(gateway.users['123']).toBe('testUser');
    expect(client.emit).toHaveBeenCalledWith('ticketGenerated', ticket);
  });

  it('should handle claim ticket with verification', () => {
    const client: Socket = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis() } as any;
    const ticket: Ticket = [
      [4, 16, '_', '_', 48, '_', 63, 76, '_'],
      [7, '_', 23, 38, '_', 52, '_', '_', 80],
      [9, '_', 25, '_', '_', 56, 64, '_', 83]
    ];
    gateway.tickets['testUser'] = ticket;
    gateway.numbersDrawn = [4, 16, 48, 63, 76, 7, 23, 38, 52, 80, 9, 25, 56, 64, 83];
    jest.spyOn(ticketService, 'verifyTicket').mockReturnValue(true);

    gateway.handleClaimTicket(client, { username: 'testUser', claimType: TicketClaimType.FullHouse });
    expect(gateway.winners[TicketClaimType.FullHouse]).toBe('testUser');
    expect(server.emit).toHaveBeenCalledWith('winnerAnnounced', { username: 'testUser', claimType: TicketClaimType.FullHouse });
  });

  it('should handle start game', () => {
    gateway.handleStartGame();
    expect(gateway.numbersDrawn).toHaveLength(0);
    expect(gateway.winners).toEqual({});
    expect(server.emit).toHaveBeenCalledWith('gameStarted');
  });

  it('should handle draw number', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    gateway.handleDrawNumber();
    expect(gateway.numbersDrawn).toContain(46);
    expect(server.emit).toHaveBeenCalledWith('numberDrawn', 46);
  });

  it('should return if ticket not found', () => {
    const client = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis(), } as unknown as Socket;
    const data = { username: 'user1', claimType: TicketClaimType.FullHouse };
    gateway.tickets = {};

    gateway.handleClaimTicket(client, data);

    expect(ticketService.verifyTicket).not.toHaveBeenCalled();
  });

  it('should emit error if claim already made', () => {
    const client = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis(), } as unknown as Socket;

    const data = { username: 'user1', claimType: TicketClaimType.FullHouse };
    const ticket: Ticket = [
      [4, 16, '_', '_', 48, '_', 63, 76, '_'],
      [7, '_', 23, 38, '_', 52, '_', '_', 80],
      [9, '_', 25, '_', '_', 56, 64, '_', 83]
    ];
    gateway.tickets['user1'] = ticket;
    gateway.winners[TicketClaimType.FullHouse] = 'user2';

    gateway.handleClaimTicket(client, data);

    expect(ticketService.verifyTicket).not.toHaveBeenCalled();
    expect(client.to(client.id).emit).toHaveBeenCalledWith('socketErr', {
      message: `${TicketClaimType.FullHouse} has already been claimed by user2`,
    });
  });

  it('should emit winner if claim is valid', () => {
    const client = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis(), } as unknown as Socket;

    const data = { username: 'user1', claimType: TicketClaimType.FullHouse };
    const ticket: Ticket = [
      [4, 16, '_', '_', 48, '_', 63, 76, '_'],
      [7, '_', 23, 38, '_', 52, '_', '_', 80],
      [9, '_', 25, '_', '_', 56, 64, '_', 83]
    ];
    gateway.tickets['user1'] = ticket;
    gateway.numbersDrawn = [4, 16, 48, 63, 76, 7, 23, 38, 52, 80, 9, 25, 56, 64, 83];

    (ticketService.verifyTicket as jest.Mock).mockReturnValue(true);

    jest.spyOn(server, 'emit');

    gateway.handleClaimTicket(client, data);

    expect(ticketService.verifyTicket).toHaveBeenCalledWith('user1', TicketClaimType.FullHouse, gateway.numbersDrawn);
    expect(gateway.winners[TicketClaimType.FullHouse]).toBe('user1');
    expect(server.emit).toHaveBeenCalledWith('winnerAnnounced', {
      username: 'user1',
      claimType: TicketClaimType.FullHouse,
    });
  });

  it('should emit error if claim is not valid', () => {
    const client = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis(), } as unknown as Socket;
    const data = { username: 'user1', claimType: TicketClaimType.FullHouse };
    const ticket: Ticket = [
      [4, 16, '_', '_', 48, '_', 63, 76, '_'],
      [7, '_', 23, 38, '_', 52, '_', '_', 80],
      [9, '_', 25, '_', '_', 56, 64, '_', 83]
    ];
    gateway.tickets['user1'] = ticket;
    gateway.numbersDrawn = [4, 16, 48, 63, 76, 7, 23, 38, 52, 80, 9, 25, 56, 64, 83];
    (ticketService.verifyTicket as jest.Mock).mockReturnValue(false);
    gateway.handleClaimTicket(client, data);

    jest.spyOn(server.to(client.id), 'emit');

    expect(ticketService.verifyTicket).toHaveBeenCalledWith('user1', TicketClaimType.FullHouse, gateway.numbersDrawn);
    expect(client.emit).toHaveBeenCalledWith('socketErr', {
      message: `${TicketClaimType.FullHouse.toString()} is not valid`,
    });
  });
});
