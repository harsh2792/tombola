export type TicketCell = number | '_';
export type TicketRow = TicketCell[];
export type Ticket = TicketRow[];
export enum TicketClaimType { 
  FirstRow,
  SecondRow,
  ThirdRow,
  EarlyFive,
  FullHouse 
}

export interface ITicketService {
  generateTicket(username: string): Ticket;
  getTicket(username: string): Ticket | undefined;
  verifyTicket(username: string, claimType: TicketClaimType, drawnNumbers: number[]): boolean;
}
