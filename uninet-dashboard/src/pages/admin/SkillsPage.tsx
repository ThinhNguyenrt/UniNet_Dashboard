import React from 'react';
import { Award, Plus, Search, Tag } from 'lucide-react';

export const SkillsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Kỹ năng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh mục kỹ năng công nghệ, kỹ năng chuyên môn và chứng chỉ đầu ra cho sinh viên.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm kỹ năng mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm kỹ năng, danh mục..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả nhóm ngành</option>
            <option>Frontend Development</option>
            <option>Backend Development</option>
            <option>Data Science & AI</option>
            <option>Cloud & DevOps</option>
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'React.js', group: 'Frontend', count: '1.240 sinh viên', level: 'Nâng cao' },
          { name: 'Node.js & Express', group: 'Backend', count: '980 sinh viên', level: 'Trung cấp' },
          { name: 'Python & Machine Learning', group: 'Data & AI', count: '750 sinh viên', level: 'Nâng cao' },
          { name: 'TypeScript', group: 'Frontend / Fullstack', count: '890 sinh viên', level: 'Trung cấp' },
          { name: 'Docker & Kubernetes', group: 'DevOps', count: '520 sinh viên', level: 'Cơ bản' },
          { name: 'UI/UX Design (Figma)', group: 'Thiết kế', count: '630 sinh viên', level: 'Cơ bản' },
        ].map((skill, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Award className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {skill.level}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{skill.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {skill.group}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{skill.count}</span>
              <button className="text-blue-600 font-semibold hover:underline">Chỉnh sửa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPage;
