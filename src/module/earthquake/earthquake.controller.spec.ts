import { ALLOWED_FILTERS, EARTHQUAKE_FEATURE } from '@/shared/constant';
import { ForbiddenFilterException } from '@/shared/exception';
import { MessageResponse } from '@/shared/model';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { RequestLogService } from '../request-log/request-log.service';
import { RequestLoggingInterceptor } from '../request-log/request-logging.interceptor';
import { EarthquakeController } from './earthquake.controller';
import { EarthquakeListResponse, EarthquakeQuery } from './earthquake.dto';
import { EarthquakeService } from './earthquake.service';

describe('EarthquakeController', () => {
  let controller: EarthquakeController;
  let service: jest.Mocked<EarthquakeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarthquakeController],
      providers: [
        {
          provide: EarthquakeService,
          useValue: {
            ingestEarthquakeData: jest.fn(),
            getEarthquakes: jest.fn(),
            getByEventId: jest.fn(),
          },
        },
        {
          provide: RequestLogService,
          useValue: { ingestLog: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn() },
        },
        RequestLoggingInterceptor,
      ],
    }).compile();

    controller = module.get<EarthquakeController>(EarthquakeController);
    service = module.get(EarthquakeService);
  });

  describe('POST /earthquake/ingest', () => {
    it('Called mocked service and return message', async () => {
      const expected = new MessageResponse(
        'Ingestion completed successfully. Stored 100 records',
      );
      service.ingestEarthquakeData.mockResolvedValue(expected);

      const actual = await controller.ingestEarthquakeData();

      expect(service.ingestEarthquakeData).toHaveBeenCalledTimes(1);
      expect(actual).toBe(expected);
    });
  });

  describe('GET /earthquakes', () => {
    it('Call mock service and return earthquake list', async () => {
      const query = { limit: 10 } as EarthquakeQuery;
      const expected = new EarthquakeListResponse([EARTHQUAKE_FEATURE], 10);
      service.getEarthquakes.mockResolvedValue(expected);

      const actual = await controller.getEarthquakes(query);

      expect(service.getEarthquakes).toHaveBeenCalledWith(query);
      expect(actual).toBe(expected);
    });

    it('Throw ForbiddenFilterException', async () => {
      const query = {
        isTsunami: true,
        location: 'CA',
      } as EarthquakeQuery;
      service.getEarthquakes.mockRejectedValue(
        new ForbiddenFilterException(
          'Invalid filters provided',
          ALLOWED_FILTERS,
        ),
      );

      await expect(controller.getEarthquakes(query)).rejects.toBeInstanceOf(
        ForbiddenFilterException,
      );
    });
  });

  describe('GET /earthquakes/:eventId', () => {
    it('Call mock service and return earthquake feature for provided event id', async () => {
      service.getByEventId.mockResolvedValue(EARTHQUAKE_FEATURE);

      const result = await controller.getByEventId('eq-1');

      expect(service.getByEventId).toHaveBeenCalledWith('eq-1');
      expect(result).toBe(EARTHQUAKE_FEATURE);
    });

    it('Throw NotFoundException when record is missing', async () => {
      service.getByEventId.mockRejectedValue(
        new NotFoundException('Not Found'),
      );

      await expect(controller.getByEventId('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
