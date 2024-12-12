import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { TicketClaimType } from './interfaces/iTicket.service';
import { GameGateway } from '../game/game.gateway';

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketService, GameGateway],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  it('should generate a ticket', () => {
    const username = 'testUser';
    const ticket = service.generateTicket(username);

    expect(ticket.length).toBe(3);
    ticket.forEach(row => {
      expect(row.filter(num => num !== '_').length).toBe(5);
    });

    const columnCounts = new Array(9).fill(0);
    ticket.flat().forEach((num, index) => {
      if (num !== '_') {
        const colIndex = index % 9;
        columnCounts[colIndex]++;
      }
    });

    columnCounts.forEach(count => {
      expect(count).toBeLessThanOrEqual(3);
    });

    expect(Object.values(service['tickets']).length).toBe(1);
  });

  it('should retrieve a ticket', () => {
    const username = 'testUser';
    service.generateTicket(username);
    const retrievedTicket = service.getTicket(username);
    expect(retrievedTicket).toBeDefined();
  });

  it('should verify first row claim', () => {
    const username = 'testUser';
    const ticket = service.generateTicket(username);
    const drawnNumbers = ticket[0].filter(num => num !== '_');
    expect(service.verifyTicket(username, TicketClaimType.FirstRow, drawnNumbers)).toBeTruthy();
  });

  it('should verify second row claim', () => {
    const username = 'testUser';
    const ticket = service.generateTicket(username);
    const drawnNumbers = ticket[1].filter(num => num !== '_');
    expect(service.verifyTicket(username, TicketClaimType.SecondRow, drawnNumbers)).toBeTruthy();
  });

  it('should verify third row claim', () => {
    const username = 'testUser';
    const ticket = service.generateTicket(username);
    const drawnNumbers = ticket[2].filter(num => num !== '_');
    expect(service.verifyTicket(username, TicketClaimType.ThirdRow, drawnNumbers)).toBeTruthy();
  });

  it('should verify early five claim', () => {
    const username = 'testUser';
    const ticket = service.generateTicket(username);
    const drawnNumbers = ticket.flat().filter(num => num !== '_').slice(0, 5);
    expect(service.verifyTicket(username, TicketClaimType.EarlyFive, drawnNumbers)).toBeTruthy();
  });

  it('should verify full house claim', () => {
    const username = 'testUser';
    const ticket = service.generateTicket(username);
    const drawnNumbers = ticket.flat().filter(num => num !== '_');
    expect(service.verifyTicket(username, TicketClaimType.FullHouse, drawnNumbers)).toBeTruthy();
  });

  it('should fail invalid claim type', () => {
    const username = 'testUser';
    service.generateTicket(username);
    const drawnNumbers = [1, 2, 3, 4, 5];
    expect(service.verifyTicket(username, null, drawnNumbers)).toBeFalsy();
  });

  it('should return false for invalid username', () => {
    const drawnNumbers = [1, 2, 3, 4, 5];
    expect(service.verifyTicket('invalidUser', TicketClaimType.FirstRow, drawnNumbers)).toBeFalsy();
  });



});


