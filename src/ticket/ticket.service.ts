import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketService {
  generateTicket(): number[][] {
    const ticket = Array.from({ length: 3 }, () => Array(9).fill('_'));
    const columns = [
      [1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 60], [61, 70], [71, 80], [81, 90]
    ];

    for (let i = 0; i < 3; i++) {
      const rowSet = new Set<number>();
      while (rowSet.size < 5) {
        const colIndex = this.getRandomInt(0, 8);
        const [min, max] = columns[colIndex];
        let num: number;
        do {
          num = this.getRandomInt(min, max);
        } while (rowSet.has(num));
        rowSet.add(num);
        ticket[i][colIndex] = num;
      }
    }

    // Sort columns individually
    for (let col = 0; col < 9; col++) {
      const columnValues = ticket.map(row => row[col]).filter(num => num !== '_');
      columnValues.sort((a, b) => a - b);
      let index = 0;
      for (let row = 0; row < 3; row++) {
        if (ticket[row][col] !== '_') {
          ticket[row][col] = columnValues[index++];
        }
      }
    }

    return ticket;
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  verifyTicket(ticket: number[][], claimType: string): boolean {
    // Logic to verify ticket based on claimType (e.g., first row, full house, etc.)
    return true;
  }
}
