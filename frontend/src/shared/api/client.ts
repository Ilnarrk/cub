import axios, { AxiosInstance } from 'axios';
import type { RandomCubeResponse, SolveRequest, SolveResponse, ValidationResponse } from '@shared/types/api';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance = axios.create({ baseURL: API_BASE, timeout: 30000 });

  async solveCube(request: SolveRequest): Promise<SolveResponse> {
    return (await this.client.post<SolveResponse>('/solve', request, { validateStatus: (s) => s < 300 })).data;
  }

  async validateCube(request: SolveRequest): Promise<ValidationResponse> {
    return (await this.client.post<ValidationResponse>('/validate', request)).data;
  }

  async randomCube(): Promise<RandomCubeResponse> {
    return (await this.client.get<RandomCubeResponse>('/random-state')).data;
  }

  async getSolveJob(jobId: string): Promise<SolveResponse> {
    return (await this.client.get<SolveResponse>(`/solve-jobs/${jobId}`, { validateStatus: (s) => s < 300 })).data;
  }
}

export const apiClient = new ApiClient();
