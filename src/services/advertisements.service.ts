import { apiClient } from './api';
import type {
  CampaignsResponse,
  CampaignResponse,
  ModerateCampaignRequest,
} from '../types/advertisements';

export const advertisementsService = {
  /**
   * Lấy danh sách chiến dịch quảng cáo cho Admin/Moderator
   * GET /api/advertisements/admin/campaigns?page=1&pageSize=20
   */
  getAdminCampaigns: async (
    page = 1,
    pageSize = 20,
    signal?: AbortSignal
  ): Promise<CampaignsResponse> => {
    const response = await apiClient.get<CampaignsResponse>(
      '/advertisements/admin/campaigns',
      {
        params: { page, pageSize },
        signal,
      }
    );
    return response.data;
  },

  /**
   * Phê duyệt hoặc từ chối chiến dịch quảng cáo
   * POST /api/advertisements/admin/campaigns/{campaignId}/moderate
   */
  moderateCampaign: async (
    campaignId: string,
    req: ModerateCampaignRequest,
    signal?: AbortSignal
  ): Promise<CampaignResponse> => {
    const payload: ModerateCampaignRequest = {
      isApproved: req.isApproved,
      reason: req.reason ? req.reason.trim() : null,
    };
    const response = await apiClient.post<CampaignResponse>(
      `/advertisements/admin/campaigns/${encodeURIComponent(campaignId)}/moderate`,
      payload,
      { signal }
    );
    return response.data;
  },
};

