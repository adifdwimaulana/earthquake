import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { RequestLogController } from './request-log.controller';
import {
  RequestCountData,
  RequestCountQuery,
  RequestCountResponse,
} from './request-log.dto';
import { RequestLogService } from './request-log.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

describe('RequestLogController', () => {
  let controller: RequestLogController;
  let service: jest.Mocked<RequestLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestLogController],
      providers: [
        {
          provide: RequestLogService,
          useValue: {
            getRequestCountPerDay: jest.fn(),
            ingestLog: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn() },
        },
        RequestLoggingInterceptor,
      ],
    }).compile();

    controller = module.get<RequestLogController>(RequestLogController);
    service = module.get(RequestLogService);
  });

  describe('GET /analytics/request-per-day', () => {
    it('Called mocked service and return request count data', async () => {
      const query = new RequestCountQuery();

      const expectedData = [
        new RequestCountData('/earthquakes', 200),
        new RequestCountData('/earthquakes/ingest', 15),
      ];
      const expected: RequestCountResponse = { data: expectedData };

      service.getRequestCountPerDay.mockResolvedValue(expected);

      const actual = await controller.getRequestCountByEndpoint(query);

      expect(service.getRequestCountPerDay).toHaveBeenCalledWith(query);
      expect(service.getRequestCountPerDay).toHaveBeenCalledTimes(1);
      expect(actual).toBe(expected);
    });

    it('Called mocked service without endpoint filter', async () => {
      const query = {
        date: new Date('2025-10-26'),
      } as RequestCountQuery;

      const expectedData = [
        new RequestCountData('/earthquakes', 150),
        new RequestCountData('/earthquakes/ingest', 25),
        new RequestCountData('/analytics/request-per-day', 10),
      ];
      const expected: RequestCountResponse = { data: expectedData };

      service.getRequestCountPerDay.mockResolvedValue(expected);

      const actual = await controller.getRequestCountByEndpoint(query);

      expect(service.getRequestCountPerDay).toHaveBeenCalledWith(query);
      expect(service.getRequestCountPerDay).toHaveBeenCalledTimes(1);
      expect(actual).toBe(expected);
    });

    it('Called mocked service and return empty data when no requests found', async () => {
      const query = {
        date: new Date('2025-01-01'),
        endpoint: '/nonexistent',
      } as RequestCountQuery;

      const expected: RequestCountResponse = { data: [] };

      service.getRequestCountPerDay.mockResolvedValue(expected);

      const actual = await controller.getRequestCountByEndpoint(query);

      expect(service.getRequestCountPerDay).toHaveBeenCalledWith(query);
      expect(service.getRequestCountPerDay).toHaveBeenCalledTimes(1);
      expect(actual).toBe(expected);
    });
  });
});
