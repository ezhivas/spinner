import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/utils/api-config';
import { logger } from '@/utils/logger';

/**
 * Создание экземпляра Axios клиента
 */
class ApiClient {
  private axiosInstance: AxiosInstance | null = null;
  private baseURL: string = '';
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Инициализация клиента
   */
  async init(): Promise<void> {
    // Если уже инициализирован, пропускаем
    if (this.initialized) {
      return;
    }

    // Если инициализация в процессе, ждем её завершения
    if (this.initPromise) {
      return this.initPromise;
    }

    // Запускаем инициализацию
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    this.baseURL = await getApiBaseUrl();

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor для обработки ошибок
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('API Error', error);
        return Promise.reject(error);
      }
    );

    this.initialized = true;
  }

  /**
   * Получение экземпляра Axios
   */
  async getInstance(): Promise<AxiosInstance> {
    // Если не инициализирован, инициализируем автоматически
    if (!this.initialized) {
      await this.init();
    }
    
    if (!this.axiosInstance) {
      throw new Error('ApiClient initialization failed');
    }
    
    return this.axiosInstance;
  }

  /**
   * GET запрос
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const instance = await this.getInstance();
    const response = await instance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST запрос
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const instance = await this.getInstance();
    const response = await instance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT запрос
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const instance = await this.getInstance();
    const response = await instance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE запрос
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const instance = await this.getInstance();
    const response = await instance.delete<T>(url, config);
    return response.data;
  }

  /**
   * PATCH запрос
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const instance = await this.getInstance();
    const response = await instance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Получить базовый URL API
   */
  async getBaseUrl(): Promise<string> {
    if (!this.initialized) {
      await this.init();
    }
    return this.baseURL;
  }
}

// Singleton экземпляр
export const apiClient = new ApiClient();
