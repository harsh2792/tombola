import { Injectable } from '@nestjs/common';
import { ITicketService, Ticket, TicketRow, TicketClaimType } from './interfaces/iTicket.service';

@Injectable()
export class TicketService implements ITicketService {
    private tickets: { [username: string]: Ticket } = {};


    /**
     * Generates a ticket for a given username
     * The ticket is a 3x9 2D array, where each element is a number between 1 and 90
     * Each column is sorted individually, and each row has 5 numbers
     * The numbers are distributed such that each column has no more than 3 numbers
     * The numbers are also distributed such that each 10th number range (1-10, 11-20, etc.) has no more than 3 numbers
     * @param {string} username The username to generate the ticket for
     * @returns {Ticket} The generated ticket
     */
    generateTicket(username: string): Ticket {
        const columns = [
            [1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 60], [61, 70], [71, 80], [81, 90]
        ];
        const numberDistribution: { [key: number]: number } = {};
        const numSet = new Set<number>();
        const ticket: Ticket = Array.from({ length: 3 }, () => Array(9).fill('_') as TicketRow);

        // Ensure each column has no more than 3 numbers
        for (let row = 0; row < 3; row++) {
            let count = 0;

            // Each row must have 5 numbers
            while (count < 5) {
                const colIndex = this.getRandomInt(0, 8);
                const [min, max] = columns[colIndex];
                let num = this.getRandomInt(min, max);

                // Check value distribution and duplicate entries
                if (ticket[row][colIndex] === '_' && (numberDistribution[Math.floor((num - 1) / 10)] ?? 0) < 3 && !numSet.has(num)) {
                    ticket[row][colIndex] = num;
                    numberDistribution[Math.floor((num - 1) / 10)] = (numberDistribution[Math.floor((num - 1) / 10)] ?? 0) + 1;
                    numSet.add(num);
                    count++;
                }
            }
        }
        
        // Sort columns individually
        this.tickets[username] = this.sortColumns(ticket);;
        return ticket;
    }

    /**
     * Sorts each column of the ticket individually in ascending order.
     * 
     * This function iterates over each column of the ticket and sorts the
     * non-placeholder ('_') numbers within that column. The sorted numbers
     * are then placed back into their respective positions in the column,
     * preserving the structure of the ticket.
     * 
     * @param {Ticket} ticket - The ticket whose columns are to be sorted.
     * @returns {Ticket} - The ticket with sorted columns.
     */
    private sortColumns(ticket: Ticket) {
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

    /**
     * Retrieves a ticket for a given username
     * @param {string} username The username to retrieve the ticket for
     * @returns {Ticket | undefined} The ticket if found, undefined otherwise
     */
    getTicket(username: string): Ticket | undefined {
        return this.tickets[username];
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.random() for generating the random number
     * @param {number} min The minimum value (inclusive)
     * @param {number} max The maximum value (inclusive)
     * @returns {number} A random integer between min and max
     */
    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


/**
 * Verifies if a ticket claim is valid based on the claim type and drawn numbers.
 * 
 * This function checks if the ticket associated with the given username satisfies
 * the conditions for the specified claim type, using the numbers that have been drawn.
 * It verifies that the claim includes the last drawn number for additional validation.
 * 
 * @param {string} username - The username of the player making the claim.
 * @param {TicketClaimType} claimType - The type of claim being made (e.g., FirstRow, SecondRow, etc.).
 * @param {number[]} drawnNumbers - Array of numbers that have been drawn so far.
 * 
 * @returns {boolean} - Returns true if the claim is valid, false otherwise.
 */
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

    /**
     * Verifies if a row of a ticket is valid, given the drawn numbers.
     * 
     * This function filters out the '_' placeholder values from the row, and
     * then checks if all the remaining numbers in the row are present in the
     * given drawnNumbers array.
     * 
     * @param {TicketRow} row - The row of the ticket to be verified.
     * @param {number[]} drawnNumbers - Array of numbers that have been drawn so far.
     * @returns {boolean} - Returns true if the row is valid, false otherwise.
     */
    private verifyRow(row: TicketRow, drawnNumbers: number[]): boolean {
        return row.filter(num => num !== '_').every(num => drawnNumbers.includes(num));
    }

    /**
     * Verifies if a player has at least 5 numbers in a row on their ticket, given the drawn numbers.
     * 
     * This function flattens the ticket 2D array, filters out the '_' placeholder values, and
     * then checks if at least 5 numbers in the resulting array are present in the given
     * drawnNumbers array.
     * 
     * @param {Ticket} ticket - The ticket to be verified.
     * @param {number[]} drawnNumbers - Array of numbers that have been drawn so far.
     * @returns {boolean} - Returns true if the player has at least 5 numbers in a row, false otherwise.
     */
    private verifyFirstFive(ticket: Ticket, drawnNumbers: number[]): boolean {
        const numbers = ticket.flat().filter(num => num !== '_');
        return numbers.filter(num => drawnNumbers.includes(num)).length >= 5;
    }

    /**
     * Verifies if a player has all numbers on their ticket, given the drawn numbers.
     * 
     * This function flattens the ticket 2D array, filters out the '_' placeholder values, and
     * then checks if all the remaining numbers in the resulting array are present in the given
     * drawnNumbers array.
     * 
     * @param {Ticket} ticket - The ticket to be verified.
     * @param {number[]} drawnNumbers - Array of numbers that have been drawn so far.
     * @returns {boolean} - Returns true if the player has all numbers on their ticket, false otherwise.
     */
    private verifyFullHouse(ticket: Ticket, drawnNumbers: number[]): boolean {
        return ticket.flat().filter(num => num !== '_').every(num => drawnNumbers.includes(num));
    }
}
