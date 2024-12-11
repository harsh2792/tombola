import { Injectable } from '@nestjs/common';
import { ITicketService, Ticket, TicketRow, TicketClaimType } from './interfaces/iTicket.service';

@Injectable()
export class TicketService implements ITicketService {
    private tickets: { [username: string]: Ticket } = {};


    generateTicket(username: string): Ticket {
        const ticket: Ticket = Array.from({ length: 3 }, () => Array(9).fill('_') as TicketRow);
        const columns = [
            [1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 60], [61, 70], [71, 80], [81, 90]
        ];
        const numberDistribution: { [key: number]: number } = {};

        // Ensure each column has no more than 3 numbers
        for (let row = 0; row < 3; row++) {
            let count = 0;
            while (count < 5) {
                const colIndex = this.getRandomInt(0, 8);
                const [min, max] = columns[colIndex];
                let num;
                let attempts = 0;
                do {
                    num = this.getRandomInt(min, max);
                    attempts++;
                    if (attempts > 10) break;  // To avoid infinite loop
                } while (ticket[row][colIndex] !== '_' || (numberDistribution[Math.floor((num - 1) / 10)] ?? 0) >= 3);

                if (ticket[row][colIndex] === '_' && (numberDistribution[Math.floor((num - 1) / 10)] ?? 0) < 3) {
                    ticket[row][colIndex] = num;
                    numberDistribution[Math.floor((num - 1) / 10)] = (numberDistribution[Math.floor((num - 1) / 10)] ?? 0) + 1;
                    count++;
                }
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

        this.tickets[username] = ticket;
        return ticket;
    }

    getTicket(username: string): Ticket | undefined {
        return this.tickets[username];
    }

    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    verifyTicket(username: string, claimType: TicketClaimType, drawnNumbers: number[]): boolean {
        const ticket = this.getTicket(username);
        if (!ticket || drawnNumbers.length === 0) {
            return false;
        }

        const lastDrawnNumber = drawnNumbers[drawnNumbers.length - 1];

        switch (claimType) {
            case TicketClaimType.FirstRow:
                return this.verifyRow(ticket[0], drawnNumbers) && ticket[0].includes(lastDrawnNumber);
            case TicketClaimType.SecondRow:
                return this.verifyRow(ticket[1], drawnNumbers) && ticket[1].includes(lastDrawnNumber);
            case TicketClaimType.ThirdRow:
                return this.verifyRow(ticket[2], drawnNumbers) && ticket[2].includes(lastDrawnNumber);
            case TicketClaimType.EarlyFive:
                return this.verifyFirstFive(ticket, drawnNumbers) && ticket.flat().includes(lastDrawnNumber);
            case TicketClaimType.FullHouse:
                return this.verifyFullHouse(ticket, drawnNumbers) && ticket.flat().includes(lastDrawnNumber);
            default:
                return false;
        }
    }

    private verifyRow(row: TicketRow, drawnNumbers: number[]): boolean {
        return row.filter(num => num !== '_').every(num => drawnNumbers.includes(num));
    }

    private verifyFirstFive(ticket: Ticket, drawnNumbers: number[]): boolean {
        const numbers = ticket.flat().filter(num => num !== '_');
        return numbers.filter(num => drawnNumbers.includes(num)).length >= 5;
    }

    private verifyFullHouse(ticket: Ticket, drawnNumbers: number[]): boolean {
        return ticket.flat().filter(num => num !== '_').every(num => drawnNumbers.includes(num));
    }
}
