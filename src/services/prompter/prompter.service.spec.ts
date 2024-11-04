import { Test, TestingModule } from '@nestjs/testing';
import { PrompterService } from './prompter.service';

describe('PrompterService', () => {
  let service: PrompterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrompterService],
    }).compile();

    service = module.get<PrompterService>(PrompterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
