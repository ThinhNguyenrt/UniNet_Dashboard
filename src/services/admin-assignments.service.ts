import { apiClient } from './api';
import type {
  AssignmentsResponse,
  AssignmentDetailResponse,
  AssignmentResponse,
  SuitableVerificatorResponse,
  SuitableAssessorsResponse,
  AssessorAvailabilityItem,
  CreateAssignmentRequest,
  ReplaceVerificatorRequest,
  VerificationAssignmentStatus,
} from '../types/admin-project-verifications';

export const adminAssignmentsService = {
  /**
   * Lấy danh sách toàn bộ phân công thẩm định (Dành cho Admin)
   */
  async getAssignments(
    status?: VerificationAssignmentStatus,
    page = 1,
    pageSize = 10,
    signal?: AbortSignal
  ): Promise<AssignmentsResponse> {
    const params = new URLSearchParams();
    if (status !== undefined && status !== null) {
      params.append('status', status.toString());
    }
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<AssignmentsResponse>(
      `/assignments?${params.toString()}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Xem chi tiết một phân công (kèm deadline, replacement metadata, rubric...)
   */
  async getAssignmentDetail(
    assignmentId: string,
    signal?: AbortSignal
  ): Promise<AssignmentDetailResponse> {
    const response = await apiClient.get<AssignmentDetailResponse>(
      `/assignments/${assignmentId}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Tải danh sách người thẩm định phù hợp (Candidates)
   * Nếu có replaceAssignmentId, backend sẽ áp dụng điều kiện cho trường hợp thay người
   */
  async getCandidates(
    projectVerificationId: string,
    replaceAssignmentId?: string,
    signal?: AbortSignal
  ): Promise<SuitableVerificatorResponse[]> {
    const params = new URLSearchParams();
    params.append('projectVerificationId', projectVerificationId);
    if (replaceAssignmentId) {
      params.append('replaceAssignmentId', replaceAssignmentId);
    }

    const response = await apiClient.get<SuitableVerificatorResponse[]>(
      `/assignments/availability?${params.toString()}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Lấy danh sách chuyên gia thẩm định phù hợp chuyên ngành của dự án
   * GET /api/admin/projects/{projectId}/suitable-assessors?page=...&pageSize=...
   */
  async getSuitableAssessors(
    projectId: string,
    page = 1,
    pageSize = 20,
    signal?: AbortSignal
  ): Promise<SuitableAssessorsResponse> {
    const response = await apiClient.get<SuitableAssessorsResponse>(
      `/admin/projects/${projectId}/suitable-assessors?page=${page}&pageSize=${pageSize}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Kiểm tra khả năng nhận lịch của các assessor cho hồ sơ thẩm định cụ thể
   * GET /api/assignments/availability?projectVerificationId={verificationId}
   */
  async getAvailability(
    projectVerificationId: string,
    signal?: AbortSignal
  ): Promise<AssessorAvailabilityItem[]> {
    const response = await apiClient.get<AssessorAvailabilityItem[]>(
      `/assignments/availability?projectVerificationId=${projectVerificationId}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Phân công người thẩm định cho hồ sơ
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<AssignmentResponse> {
    const response = await apiClient.post<AssignmentResponse>('/assignments', data);
    return response.data;
  },

  /**
   * Thay thế người thẩm định (Reassign)
   */
  async replaceVerificator(
    assignmentId: string,
    data: ReplaceVerificatorRequest
  ): Promise<AssignmentResponse> {
    const response = await apiClient.post<AssignmentResponse>(
      `/assignments/${assignmentId}/replace`,
      data
    );
    return response.data;
  },
};

