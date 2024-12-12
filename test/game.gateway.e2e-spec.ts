import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from '../src/game/game.gateway';
import { TicketService } from '../src/ticket/ticket.service';
import { Server, Socket } from 'socket.io';
import { Ticket, TicketClaimType } from '../src/ticket/interfaces/iTicket.service';

describe('GameGateway Integration', () => {
    let gateway: GameGateway;
    let ticketService: TicketService;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameGateway, TicketService],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        ticketService = module.get<TicketService>(TicketService);
        server = new Server();
        gateway.server = server;
    });

    const testTicket1: Ticket = [
        [4, 16, '_', '_', 48, '_', 60, 76, '_'],
        [7, '_', 23, 38, '_', 52, '_', '_', 80],
        [9, '_', 25, '_', '_', 56, 64, '_', 83]
    ];
    const testTicket2: Ticket = [
        [10, 20, '_', 30, 40, '_', 50, 60, '_'],
        [11, '_', 21, 31, '_', 41, '_', '_', 61],
        [12, '_', 22, '_', '_', 32, 42, '_', 62]
    ];

    it('should generate and retrieve a ticket, then verify a claim', () => {
        const client: Socket = { id: '123', emit: jest.fn() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;
        const drawnNumbers = ticket.flat().filter(num => num !== '_');
        expect(ticketService.verifyTicket('testUser', TicketClaimType.FullHouse, drawnNumbers)).toBeTruthy();
    });

    it('should handle start game and draw numbers', () => {
        gateway.handleStartGame();
        expect(gateway.numbersDrawn).toHaveLength(0);
        expect(gateway.winners).toEqual({});

        gateway.handleDrawNumber();
        expect(gateway.numbersDrawn).toHaveLength(1);
    });

    it('should correctly handle claim ticket', () => {
        const client: Socket = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis() } as any;
        gateway.tickets['testUser'] = testTicket1;
        gateway.numbersDrawn = testTicket1.flat().filter(num => num !== '_');
        jest.spyOn(ticketService, 'verifyTicket').mockReturnValue(true);

        gateway.handleClaimTicket(client, { username: 'testUser', claimType: TicketClaimType.FullHouse });
        expect(gateway.winners[TicketClaimType.FullHouse]).toBe('testUser');
    });


    it('should handle second user not being able to claim an already claimed ticket type', () => {
        const client1: Socket = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis() } as any;
        const client2: Socket = { id: '456', emit: jest.fn(), to: jest.fn().mockReturnThis() } as any;


        gateway.tickets['user1'] = testTicket1;
        gateway.tickets['user2'] = testTicket2;

        gateway.numbersDrawn = [4,16,48,62,76,7,23,38,52,80,9,25,56,64,83,4,16,48,62,76,7,23,38,52,80,9,25,56,64,83, 60];

        jest.spyOn(ticketService, 'verifyTicket').mockReturnValue(true);

        // First user claims FullHouse
        gateway.handleClaimTicket(client1, { username: 'user1', claimType: TicketClaimType.FullHouse });
        expect(gateway.winners[TicketClaimType.FullHouse]).toBe('user1');

        // Second user tries to claim FullHouse
        gateway.handleClaimTicket(client2, { username: 'user2', claimType: TicketClaimType.FullHouse });
        expect(gateway.winners[TicketClaimType.FullHouse]).toBe('user1');
        expect(client2.emit).toHaveBeenCalledWith('socketErr', {
            message: `${TicketClaimType.FullHouse} has already been claimed by user1`
        });
    });

    it('should verify FirstRow claim correctly', () => {
        const client: Socket = { id: '123', emit: jest.fn() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;

        const drawnNumbers = ticket[0].filter(num => num !== '_');
        expect(ticketService.verifyTicket('testUser', TicketClaimType.FirstRow, drawnNumbers)).toBeTruthy();
    });

    it('should verify SecondRow claim correctly', () => {
        const client: Socket = { id: '123', emit: jest.fn() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;
        const drawnNumbers = ticket[1].filter(num => num !== '_');
        expect(ticketService.verifyTicket('testUser', TicketClaimType.SecondRow, drawnNumbers)).toBeTruthy();
    });

    it('should verify ThirdRow claim correctly', () => {
        const client: Socket = { id: '123', emit: jest.fn() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;
        const drawnNumbers = ticket[2].filter(num => num !== '_');
        expect(ticketService.verifyTicket('testUser', TicketClaimType.ThirdRow, drawnNumbers)).toBeTruthy();
    });

    it('should verify EarlyFive claim correctly', () => {
        const client: Socket = { id: '123', emit: jest.fn() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;
        const drawnNumbers = ticket.flat().filter(num => num !== '_').slice(0, 5);
        expect(ticketService.verifyTicket('testUser', TicketClaimType.EarlyFive, drawnNumbers)).toBeTruthy();
    });

    it('should handle invalid claim type gracefully', () => {
        const client: Socket = { id: '123', emit: jest.fn() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;

        const drawnNumbers = ticket.flat().filter(num => num !== '_');
        expect(ticketService.verifyTicket('testUser', null, drawnNumbers)).toBeFalsy();
    });

    it('should handle duplicate claim gracefully', () => {
        const client: Socket = { id: '123', emit: jest.fn(), to: jest.fn().mockReturnThis() } as any;
        gateway.handleEnterUsername(client, 'testUser');
        const ticket = ticketService.generateTicket('testUser');
        gateway.tickets['testUser'] = ticket;


        gateway.handleEnterUsername(client, 'testUser2');
        const ticket2 = ticketService.generateTicket('testUser2');
        gateway.tickets['testUser'] = ticket2;

        const drawnNumbers = ticket.flat().filter(num => num !== '_');
        gateway.numbersDrawn = drawnNumbers;
        gateway.winners[TicketClaimType.FullHouse] = 'testUser';

        gateway.handleClaimTicket(client, { username: 'testUser2', claimType: TicketClaimType.FullHouse });
        expect(client.to(client.id).emit).toHaveBeenCalledWith('socketErr', {
            message: `${TicketClaimType.FullHouse.toString()} has already been claimed by testUser`
        });
    });
});
