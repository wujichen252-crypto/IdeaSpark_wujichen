import type { ProjectModule, StageChecklistItem, Artifact, ModuleData } from '@/store/modules/aiWorkshop'

export type { ProjectModule, StageChecklistItem, Artifact, ModuleData }

export const MODULE_ORDER: ProjectModule[] = ['home', 'idea', 'product', 'brand', 'ui', 'feasibility', 'docs']

export function createDefaultModules(): Record<ProjectModule, ModuleData> {
  return {
    home: {
      key: 'home',
      label: '项目首页',
      description: '项目概览与进度追踪',
      checklist: [],
      artifacts: []
    },
    idea: {
      key: 'idea',
      label: '创意与需求',
      description: '解决"值不值得做"：痛点分析、需求验证与竞品对比',
      checklist: [
        { id: 'i1', label: '用户痛点拆解', completed: false },
        { id: 'i2', label: '核心需求假设', completed: false },
        { id: 'i3', label: '竞品思路对比', completed: false }
      ],
      artifacts: []
    },
    product: {
      key: 'product',
      label: '产品方案',
      description: '解决"怎么做"：功能结构、流程设计与 MVP 定义',
      checklist: [
        { id: 'p1', label: '功能模块草图', completed: false },
        { id: 'p2', label: '用户使用流程', completed: false },
        { id: 'p3', label: 'MVP 方案定义', completed: false },
        { id: 'p4', label: '产品边界说明', completed: false }
      ],
      artifacts: []
    },
    brand: {
      key: 'brand',
      label: '品牌与表达',
      description: '解决"怎么讲清楚"：命名、Slogan 与文案包装',
      checklist: [
        { id: 'b1', label: '产品命名与 Slogan', completed: false },
        { id: 'b2', label: '官网首屏文案', completed: false },
        { id: 'b3', label: '推介文案', completed: false }
      ],
      artifacts: []
    },
    ui: {
      key: 'ui',
      label: '视觉方向',
      description: '定义视觉风格与 Logo 概念',
      checklist: [
        { id: 'u1', label: '风格选择', completed: false },
        { id: 'u2', label: 'Logo 概念说明', completed: false },
        { id: 'u3', label: '首页结构草案', completed: false }
      ],
      artifacts: []
    },
    feasibility: {
      key: 'feasibility',
      label: '可行性评估',
      description: '商业、技术与法律风险评估',
      checklist: [
        { id: 'f1', label: '商业可行性分析', completed: false },
        { id: 'f2', label: '实现复杂度评估', completed: false },
        { id: 'f3', label: '风险清单与应对', completed: false }
      ],
      artifacts: []
    },
    docs: {
      key: 'docs',
      label: '文档中心',
      description: '项目所有交付物的汇总',
      checklist: [
        { id: 'd1', label: '项目说明书', completed: false },
        { id: 'd2', label: '汇报材料大纲', completed: false }
      ],
      artifacts: []
    }
  }
}

export const TEMPLATES: Record<string, Partial<Record<ProjectModule, Omit<ModuleData, 'key'>>>> = {
  startup: {
    idea: {
      label: '商业机会分析',
      description: '深入分析市场痛点与商业机会',
      checklist: [
        { id: 's_i1', label: '市场规模估算', completed: false },
        { id: 's_i2', label: '目标客户画像', completed: false },
        { id: 's_i3', label: '商业模式画布', completed: false }
      ],
      artifacts: []
    },
    product: {
      label: 'MVP 设计',
      description: '定义最小可行性产品',
      checklist: [
        { id: 's_p1', label: '核心功能列表', completed: false },
        { id: 's_p2', label: '用户旅程图', completed: false }
      ],
      artifacts: []
    },
    brand: {
      label: '品牌构建',
      description: '打造初创品牌形象',
      checklist: [
        { id: 's_b1', label: '品牌故事', completed: false },
        { id: 's_b2', label: 'Pitch Deck 大纲', completed: false }
      ],
      artifacts: []
    }
  },
  content: {
    idea: {
      label: '内容定位',
      description: '确定内容垂类与受众',
      checklist: [
        { id: 'c_i1', label: '账号定位分析', completed: false },
        { id: 'c_i2', label: '爆款选题库', completed: false }
      ],
      artifacts: []
    },
    product: {
      label: '内容规划',
      description: '规划内容形式与栏目',
      checklist: [
        { id: 'c_p1', label: '内容栏目策划', completed: false },
        { id: 'c_p2', label: '发布日历', completed: false }
      ],
      artifacts: []
    },
    brand: {
      label: '人设打造',
      description: '建立创作者个人品牌',
      checklist: [
        { id: 'c_b1', label: '个人简介/Bio', completed: false },
        { id: 'c_b2', label: '视觉风格统一', completed: false }
      ],
      artifacts: []
    }
  }
}
