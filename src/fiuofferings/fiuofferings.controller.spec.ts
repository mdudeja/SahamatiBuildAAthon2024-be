import { Test, TestingModule } from '@nestjs/testing';
import { FiuofferingsController } from './fiuofferings.controller';
import { FiuofferingsService } from './fiuofferings.service';

describe('FiuofferingsController', () => {
  let controller: FiuofferingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiuofferingsController],
      providers: [FiuofferingsService],
    }).compile();

    controller = module.get<FiuofferingsController>(FiuofferingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
