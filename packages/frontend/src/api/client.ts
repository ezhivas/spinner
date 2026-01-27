import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/utils/api-config';

/**
 * Создание экземпляра Axios клиента
 */
class ApiClient {
  private axiosInstance: AxiosInstance | null = null;
  private baseURL: string = '';

  /**
   * Инициализация клиента
   */
  async init(): Promise<void> {
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
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Получение экземпляра Axios
   */
  getInstance(): AxiosInstance {
    if (!this.axiosInstance) {
      throw new Error('ApiClient not initialized. Call init() first.');
    }
    return this.axiosInstance;
  }

  /**
   * GET запрос
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().get<T>(url, config);
    return response.data;
  }

  /**
   * POST запрос
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT запрос
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE запрос
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().delete<T>(url, config);
    return response.data;
  }

  /**
   * PATCH запрос
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().patch<T>(url, data, config);
    return response.data;
  }
}

// Singleton экземпляр
export const apiClient = new ApiClient();
