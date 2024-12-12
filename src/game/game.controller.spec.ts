import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';

describe('GameController', () => {
    let gameController: GameController;
    let gameGateway: GameGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameController],
            providers: [
                {
                    provide: GameGateway,
                    useValue: {
                        handleStartGame: jest.fn(),
                        handleDrawNumber: jest.fn(),
                    },
                },
            ],
        }).compile();

        gameController = module.get<GameController>(GameController);
        gameGateway = module.get<GameGateway>(GameGateway);
    });

    it('should be defined', () => {
        expect(gameController).toBeDefined();
    });

    it('should start a game', () => {
        const result = gameController.startGame();
        expect(result).toBe('Game started!');
        expect(gameGateway.handleStartGame).toHaveBeenCalled();
    });

    it('should draw a number', () => {
        const result = gameController.drawNumber();
        expect(result).toBe('Number drawn!');
        expect(gameGateway.handleDrawNumber).toHaveBeenCalled();
    });
});
