import { useEffect, useState } from 'react';
import {
  Layout,
  Form,
  Button,
  Spin,
  Empty,
  Typography,
  Card,
  Tag,
  Divider,
  Banner,
} from '@douyinfe/semi-ui';
import { dashboard, base, DashboardState, FieldType } from '@lark-base-open/js-sdk';
import MarkdownRenderer from './components/MarkdownRenderer';
import './App.css';

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

// 插件配置 - 与飞书 saveConfig 格式匹配
interface PluginConfig {
  // 记录选择配置
  recordConfig?: {
    tableId: string;
    recordId: string;
    fieldId: string;
  };
  customConfig: {
    tableId: string;
    recordId: string;
    fieldId: string;
    showToc: boolean;
    autoUpdate: boolean;
  };
  // 飞书要求的必填字段
  dataConditions: any[];
}

// 获取状态名称
const getStateName = (state: DashboardState | undefined): string => {
  if (state === undefined) return '未定义';
  switch (state) {
    case DashboardState.Create:
      return '创建状态 (Create)';
    case DashboardState.Config:
      return '配置状态 (Config)';
    case DashboardState.View:
      return '展示状态 (View)';
    case DashboardState.FullScreen:
      return '全屏状态 (FullScreen)';
    default:
      return `未知状态 (${state})`;
  }
};

// 获取状态颜色
const getStateColor = (state: DashboardState | undefined): any => {
  switch (state) {
    case DashboardState.Create:
      return 'blue';
    case DashboardState.Config:
      return 'orange';
    case DashboardState.View:
      return 'green';
    case DashboardState.FullScreen:
      return 'purple';
    default:
      return 'grey';
  }
};

// 解析富文本为 Markdown
interface RichTextSegment {
  type: string;
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

const parseRichTextToMarkdown = (segments: RichTextSegment[]): string => {
  if (!Array.isArray(segments)) return '';
  
  return segments.map((segment) => {
    if (segment.type !== 'text') return '';
    
    let text = segment.text;
    
    // 应用样式标记
    if (segment.strikethrough) {
      text = `~~${text}~~`;
    }
    if (segment.italic) {
      text = `*${text}*`;
    }
    if (segment.bold) {
      text = `**${text}**`;
    }
    if (segment.underline) {
      // Markdown 没有下划线，用 HTML 标签
      text = `<u>${text}</u>`;
    }
    
    return text;
  }).join('');
};

function App() {
  // ============ 状态显示 ============
  const [debugInfo, setDebugInfo] = useState<string[]>(['组件初始化中...']);
  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    console.log(msg);
  };

  // 仪表盘状态
  const [state, setState] = useState<DashboardState | undefined>(undefined);
  
  // 表单
  const [formApi, setFormApi] = useState<any>(null);
  
  // 数据表列表
  const [tables, setTables] = useState<any[]>([]);
  // 记录列表
  const [records, setRecords] = useState<any[]>([]);
  // 字段列表
  const [fields, setFields] = useState<any[]>([]);
  
  // Markdown 内容
  const [markdownContent, setMarkdownContent] = useState<string>('');
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 初始配置
  const [initialConfig, setInitialConfig] = useState<PluginConfig | null>(null);
  
  // SDK 是否就绪
  const [sdkReady, setSdkReady] = useState(false);

  // 待恢复的配置（用于重新进入配置状态时恢复表单）
  const [pendingRestoreConfig, setPendingRestoreConfig] = useState<PluginConfig | null>(null);

  // ============ 初始化 ============
  useEffect(() => {
    addDebug('✅ 组件已挂载');
    
    // 检查 SDK
    try {
      addDebug('📦 检查 SDK...');
      console.log('dashboard 对象:', dashboard);
      console.log('base 对象:', base);
      console.log('DashboardState:', DashboardState);
      
      // 检查 dashboard 是否有 state 属性
      if (dashboard && typeof dashboard === 'object') {
        addDebug(`✅ Dashboard SDK 对象存在`);
        addDebug(`📊 dashboard.state: ${dashboard.state}`);
        addDebug(`📊 dashboard.state 类型: ${typeof dashboard.state}`);
        
        // 设置初始状态
        if (dashboard.state !== undefined) {
          setState(dashboard.state);
          addDebug(`🎨 当前状态: ${getStateName(dashboard.state)}`);
        } else {
          addDebug('⚠️ dashboard.state 未定义');
        }
        
        setSdkReady(true);
        
        // 加载数据表 - 使用 base 模块
        loadTables();
        
        // 尝试获取当前配置（如果已有）
        if (typeof dashboard.getConfig === 'function') {
          addDebug('🔍 尝试获取当前配置...');
          dashboard.getConfig().then((config: any) => {
            console.log('【调试】初始配置:', config);
            if (config?.customConfig?.recordId) {
              addDebug('✅ 发现已保存的配置，准备恢复');
              setInitialConfig(config as PluginConfig);
              setPendingRestoreConfig(config as PluginConfig);
              // 触发数据加载流程，在数据加载完成后恢复表单
              const { tableId } = config.customConfig;
              if (tableId) {
                addDebug(`🔄 开始恢复数据表: ${tableId.slice(-8)}`);
                // 设置表ID（这会触发handleTableChange）
                handleTableChange(tableId, true);
              }
              loadData(config as PluginConfig);
            } else {
              addDebug('ℹ️ 没有已保存的配置');
            }
          }).catch((err: any) => {
            addDebug(`⚠️ 获取初始配置失败: ${err.message}`);
          });
        }
      } else {
        addDebug('❌ Dashboard SDK 对象不存在');
      }
    } catch (err: any) {
      addDebug(`❌ SDK 错误: ${err.message}`);
      console.error('SDK 错误:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ 监听配置变化 ============
  useEffect(() => {
    if (!dashboard || typeof dashboard.onConfigChange !== 'function') {
      addDebug('⚠️ onConfigChange 不可用');
      return;
    }
    
    addDebug('👂 开始监听配置变化...');
    try {
      const unsubscribe = dashboard.onConfigChange((config) => {
        addDebug('📋 配置发生变化');
        console.log('【调试】收到新配置:', config);
        
        const pluginConfig = config as unknown as PluginConfig;
        setInitialConfig(pluginConfig);
        
        if (pluginConfig?.customConfig?.recordId) {
          addDebug(`📋 记录配置: 表=${pluginConfig.customConfig.tableId?.slice(0,8)}..., 记录=${pluginConfig.customConfig.recordId?.slice(0,8)}..., 字段=${pluginConfig.customConfig.fieldId?.slice(0,8)}...`);
          
          // 恢复表单值
          if (formApi) {
            addDebug('📝 恢复表单值...');
            formApi.setValues({
              tableId: pluginConfig.customConfig.tableId,
              recordId: pluginConfig.customConfig.recordId,
              fieldId: pluginConfig.customConfig.fieldId,
              showToc: pluginConfig.customConfig.showToc ?? false,
              autoUpdate: pluginConfig.customConfig.autoUpdate ?? true,
            });
          }
        } else {
          addDebug('⚠️ 配置中没有记录信息');
        }
        loadData(pluginConfig);
      });
      
      return () => {
        addDebug('🛑 停止监听配置变化');
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err: any) {
      addDebug(`❌ 监听配置失败: ${err.message}`);
    }
  }, [formApi]);

  // ============ 加载数据表 - 使用 base 模块 ============
  const loadTables = async () => {
    try {
      addDebug('📥 正在获取数据表列表...');
      addDebug(`📦 base 对象类型: ${typeof base}`);
      
      // 使用 base.getTableList() 而不是 dashboard.getTableList()
      if (typeof base.getTableList !== 'function') {
        addDebug(`❌ base.getTableList 不可用，类型: ${typeof base.getTableList}`);
        console.log('base 对象:', base);
        console.log('base 对象 keys:', base ? Object.keys(base) : 'undefined');
        return;
      }
      
      const tableList = await base.getTableList();
      addDebug(`✅ 获取到 ${tableList.length} 个数据表`);
      
      // 打印第一个数据表的结构用于调试
      if (tableList.length > 0) {
        const firstTable = tableList[0] as any;
        console.log('【调试】第一个数据表原始数据:', firstTable);
        console.log('【调试】数据表所有属性:', Object.keys(firstTable));
        
        // 尝试从 context 获取名称
        if (firstTable.context && Array.isArray(firstTable.context)) {
          console.log('【调试】context[0]:', firstTable.context[0]);
          console.log('【调试】context[1]:', firstTable.context[1]);
        }
      }
      
      // 处理数据表，确保有 name 属性
      const processedTables = tableList.map((table: any, index: number) => {
        let tableName = '';
        
        // 尝试从 context 数组获取名称（飞书 SDK 的特殊格式）
        if (table.context && Array.isArray(table.context) && table.context.length >= 2) {
          // context[0] 通常是名称，context[1] 是 ID
          if (typeof table.context[0] === 'string') {
            tableName = table.context[0];
          }
        }
        
        // 如果没有从 context 获取到，尝试其他属性
        if (!tableName) {
          tableName = table.name || table.tableName || table.title || table.label;
        }
        
        // 兜底显示
        if (!tableName) {
          tableName = `数据表 ${index + 1}`;
        }
        
        // 获取 ID
        let tableId = table.id;
        if (!tableId && table.context && Array.isArray(table.context) && table.context.length >= 2) {
          tableId = table.context[1];
        }
        
        addDebug(`📋 表${index + 1}: ${tableName.slice(0, 20)} (id: ${tableId?.slice(-6)})`);
        
        return {
          id: tableId,
          name: tableName,
        };
      });
      
      setTables(processedTables);
      
      // 如果有待恢复的配置，在数据表加载完成后恢复
      if (pendingRestoreConfig) {
        const { tableId } = pendingRestoreConfig.customConfig;
        if (tableId && formApi) {
          addDebug(`🔄 恢复数据表选择: ${tableId.slice(-8)}`);
          setTimeout(() => {
            formApi.setValues({ tableId });
            // 触发数据加载
            handleTableChange(tableId, true);
          }, 0);
        }
      }
    } catch (err: any) {
      addDebug(`❌ 获取数据表失败: ${err.message}`);
      console.error('获取数据表错误:', err);
    }
  };

  // ============ 加载字段 - 使用 base 模块 ============
  const loadFields = async (tableId: string, isRestore: boolean = false) => {
    try {
      addDebug(`📥 正在获取字段列表 (表ID: ${tableId})...`);
      
      // 检查 tableId 是否有效
      if (!tableId || typeof tableId !== 'string') {
        addDebug(`❌ 无效的 tableId: ${tableId} (类型: ${typeof tableId})`);
        return;
      }
      
      // 使用 base 模块获取字段列表
      if (typeof base.getTableById !== 'function') {
        addDebug(`❌ base.getTableById 不可用`);
        return;
      }
      
      addDebug(`📦 调用 base.getTableById('${tableId}')`);
      const table = await base.getTableById(tableId);
      addDebug(`✅ 获取到表对象`);
      console.log('表对象:', table);
      
      let fieldList: any[] = [];
      
      if (typeof table.getFieldMetaList !== 'function') {
        addDebug(`❌ table.getFieldMetaList 不可用，尝试 getFieldList...`);
        // 备选方案
        if (typeof table.getFieldList === 'function') {
          fieldList = await table.getFieldList();
          addDebug(`✅ 通过 getFieldList 获取到 ${fieldList.length} 个字段`);
          console.log('字段列表:', fieldList);
        } else {
          addDebug(`❌ table.getFieldList 也不可用`);
          return;
        }
      } else {
        fieldList = await table.getFieldMetaList();
        addDebug(`✅ 通过 getFieldMetaList 获取到 ${fieldList.length} 个字段`);
        console.log('字段列表:', fieldList);
      }
      
      // 过滤出文本类型的字段，同时显示所有字段以便调试
      const textFields = fieldList.filter(
        (field: any) => {
          // 接受文本类型(1)
          const isText = field.type === FieldType.Text || field.type === 1;
          return isText;
        }
      );
      addDebug(`📝 文本字段: ${textFields.length}/${fieldList.length} 个`);
      
      // 如果没有文本字段，显示所有字段以便调试
      if (textFields.length === 0 && fieldList.length > 0) {
        addDebug(`⚠️ 未找到文本字段，显示所有字段用于调试`);
        const firstFewFields = fieldList.slice(0, 10);
        firstFewFields.forEach((f: any) => {
          addDebug(`  - ${f.name}: type=${f.type}`);
        });
      }
      
      const finalFields = textFields.length > 0 ? textFields : fieldList;
      setFields(finalFields);
      
      // 如果是恢复模式且有待恢复的配置，恢复表单值
      if (isRestore && pendingRestoreConfig && formApi) {
        const { fieldId } = pendingRestoreConfig.customConfig;
        addDebug(`🔄 恢复字段选择: ${fieldId?.slice(-8)}`);
        // 使用 setTimeout 确保状态已更新
        setTimeout(() => {
          formApi.setValues({ fieldId });
          // 恢复完成后清除待恢复配置
          setPendingRestoreConfig(null);
          addDebug('✅ 表单恢复完成');
        }, 0);
      }
    } catch (err: any) {
      addDebug(`❌ 获取字段失败: ${err.message}`);
      console.error('获取字段错误:', err);
      console.error('错误堆栈:', err.stack);
    }
  };

  // ============ 加载记录列表 ============
  const loadRecords = async (tableId: string, isRestore: boolean = false) => {
    try {
      addDebug(`📥 正在获取记录列表 (表ID: ${tableId})...`);
      
      if (typeof base.getTableById !== 'function') {
        addDebug(`❌ base.getTableById 不可用`);
        return;
      }
      
      const table = await base.getTableById(tableId);
      
      // 获取字段列表以确定主键字段（第一个字段通常是主键）
      let firstFieldId: string | null = null;
      try {
        if (typeof table.getFieldMetaList === 'function') {
          const fieldMetaList = await table.getFieldMetaList();
          if (fieldMetaList.length > 0) {
            firstFieldId = fieldMetaList[0].id;
            addDebug(`📋 主键字段: ${fieldMetaList[0].name} (${firstFieldId})`);
          }
        }
      } catch (e) {
        addDebug('⚠️ 获取字段列表失败，将使用第一个非空字段作为主键');
      }
      
      // 获取记录列表（只获取前50条用于选择）
      let recordList: any[] = [];
      
      // 直接从表获取记录
      if (typeof table.getRecordIdList === 'function') {
        const recordIds = await table.getRecordIdList();
        addDebug(`✅ 获取到 ${recordIds.length} 条记录ID`);
        
        // 获取记录详情（只取前50条）
        for (const recordId of recordIds.slice(0, 50)) {
          try {
            const record = await table.getRecordById(recordId);
            
            // 提取主键显示名称
            const displayName = extractRecordDisplayName(record, firstFieldId);
            
            recordList.push({
              id: recordId,
              record: record,
              displayName: displayName,
            });
          } catch (e) {
            // 忽略单条记录错误
          }
        }
      }
      
      addDebug(`✅ 加载了 ${recordList.length} 条记录详情`);
      setRecords(recordList);
      
      // 如果是恢复模式且有待恢复的配置，恢复表单值
      if (isRestore && pendingRestoreConfig && formApi) {
        const { recordId } = pendingRestoreConfig.customConfig;
        addDebug(`🔄 恢复记录选择: ${recordId?.slice(-8)}`);
        // 使用 setTimeout 确保状态已更新
        setTimeout(() => {
          formApi.setValues({ recordId });
        }, 0);
      }
    } catch (err: any) {
      addDebug(`❌ 获取记录失败: ${err.message}`);
      console.error('获取记录错误:', err);
    }
  };

  // 提取记录的显示名称（主键）
  const extractRecordDisplayName = (record: any, preferredFieldId: string | null): string => {
    if (!record || !record.fields) {
      return '未命名记录';
    }
    
    const fields = record.fields;
    
    // 1. 优先使用指定的主键字段
    if (preferredFieldId && fields[preferredFieldId]) {
      const value = fields[preferredFieldId];
      const name = extractTextFromFieldValue(value);
      if (name) return name;
    }
    
    // 2. 遍历所有字段，找第一个有值的文本字段
    for (const fieldId of Object.keys(fields)) {
      const value = fields[fieldId];
      const name = extractTextFromFieldValue(value);
      if (name) return name;
    }
    
    return '未命名记录';
  };

  // 从字段值中提取文本
  const extractTextFromFieldValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // 字符串类型
    if (typeof value === 'string') {
      return value.trim() || '';
    }
    
    // 富文本类型（对象数组）
    if (Array.isArray(value)) {
      // 飞书富文本格式 [{type: 'text', text: '...'}, ...]
      const textParts = value
        .filter((item: any) => item && (item.type === 'text' || item.text))
        .map((item: any) => item.text || '')
        .join('');
      return textParts.trim() || '';
    }
    
    // 数字类型
    if (typeof value === 'number') {
      return String(value);
    }
    
    // 其他对象类型，尝试转为字符串
    if (typeof value === 'object') {
      // 如果是简单的对象，可能有 text 或 name 属性
      if (value.text && typeof value.text === 'string') {
        return value.text.trim();
      }
      if (value.name && typeof value.name === 'string') {
        return value.name.trim();
      }
    }
    
    return '';
  };

  // ============ 数据表变更 ============
  const handleTableChange = async (tableId: string, isRestore: boolean = false) => {
    addDebug(`🔄 选择数据表: ${tableId} (类型: ${typeof tableId}, 恢复模式: ${isRestore})`);
    
    // 确保 tableId 是字符串
    if (!tableId || typeof tableId !== 'string') {
      addDebug(`❌ 无效的 tableId，跳过加载`);
      return;
    }
    
    // 如果不是恢复模式，清空后续选择
    if (!isRestore) {
      formApi?.setValues({ recordId: undefined, fieldId: undefined });
    }
    setRecords([]);
    setFields([]);
    
    // 加载所有记录和字段
    await loadRecords(tableId, isRestore);
    await loadFields(tableId, isRestore);
  };

  // ============ 加载数据 - 记录模式 ============
  const loadData = async (config?: PluginConfig) => {
    if (!config?.customConfig) {
      addDebug('⚠️ 没有自定义配置');
      return;
    }
    
    const { tableId, recordId, fieldId } = config.customConfig;
    
    if (!tableId) {
      addDebug('⚠️ 缺少表ID');
      return;
    }
    if (!recordId) {
      addDebug('⚠️ 缺少记录ID');
      return;
    }
    if (!fieldId) {
      addDebug('⚠️ 缺少字段ID');
      return;
    }
    
    try {
      setLoading(true);
      addDebug(`📥 正在加载记录数据...`);
      addDebug(`📋 表: ${tableId}, 记录: ${recordId}, 字段: ${fieldId}`);
      
      // 使用 base SDK 获取记录详情
      if (typeof base.getTableById !== 'function') {
        addDebug('❌ base.getTableById 不可用');
        return;
      }
      
      const table = await base.getTableById(tableId);
      addDebug(`✅ 获取到表对象`);
      
      const record = await table.getRecordById(recordId);
      
      addDebug(`✅ 获取到记录`);
      console.log('【调试】记录详情:', record);
      console.log('【调试】记录字段:', record.fields);
      console.log('【调试】目标字段ID:', fieldId);
      console.log('【调试】目标字段值:', record.fields[fieldId]);
      
      // 获取指定字段的值
      const fieldValue = record.fields[fieldId];
      console.log('【调试】字段值类型:', typeof fieldValue);
      console.log('【调试】字段值内容:', fieldValue);
      
      let content = '';
      
      if (typeof fieldValue === 'string') {
        // 纯文本字段
        content = fieldValue;
        addDebug(`✅ 字段值为纯文本，长度: ${content.length}`);
      } else if (Array.isArray(fieldValue)) {
        // 富文本字段 - 对象数组格式
        addDebug(`📝 检测到富文本字段，${fieldValue.length} 个段落`);
        content = parseRichTextToMarkdown(fieldValue as RichTextSegment[]);
        addDebug(`✅ 富文本转换完成，长度: ${content.length}`);
      } else if (fieldValue && typeof fieldValue === 'object') {
        // 其他对象类型，尝试提取所有文本字段
        content = JSON.stringify(fieldValue);
        addDebug(`⚠️ 字段值为对象，已转为JSON，长度: ${content.length}`);
      } else if (fieldValue === null) {
        addDebug(`⚠️ 字段值为 null`);
      } else if (fieldValue === undefined) {
        addDebug(`⚠️ 字段值为 undefined`);
      } else {
        addDebug(`⚠️ 字段值类型: ${typeof fieldValue}`);
      }
      
      addDebug(`📝 最终内容长度: ${content.length}`);
      setMarkdownContent(content);
      
    } catch (err: any) {
      addDebug(`❌ 加载数据失败: ${err.message}`);
      console.error('加载数据错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============ 保存配置 ============
  const handleSave = async () => {
    try {
      const values = formApi?.getValues();
      addDebug(`💾 点击保存按钮`);
      addDebug(`📋 表单值: ${JSON.stringify(values)}`);
      
      // 检查必填项
      if (!values?.tableId) {
        addDebug('⚠️ 缺少数据表，无法保存');
        return;
      }
      if (!values?.recordId) {
        addDebug('⚠️ 缺少记录，无法保存');
        return;
      }
      if (!values?.fieldId) {
        addDebug('⚠️ 缺少字段，无法保存');
        return;
      }

      // 构建配置 - 记录选择模式
      // 注意：飞书 saveConfig 会将整个对象保存，我们需要符合其格式要求
      const config: PluginConfig = {
        // 使用 customConfig 来存储我们的自定义配置
        customConfig: {
          tableId: values.tableId,
          recordId: values.recordId,
          fieldId: values.fieldId,
          showToc: values.showToc ?? false,
          autoUpdate: values.autoUpdate ?? true,
        },
        // 飞书要求的必填字段
        dataConditions: [],
      };

      addDebug(`📤 准备调用 saveConfig`);
      addDebug(`📋 配置内容: ${JSON.stringify(config, null, 2)}`);
      
      if (typeof dashboard.saveConfig !== 'function') {
        addDebug('❌ saveConfig 不可用');
        return;
      }
      
      try {
        addDebug('⏳ 正在调用 saveConfig...');
        await dashboard.saveConfig(config);
        addDebug('✅ 配置保存成功！');
      } catch (saveErr: any) {
        addDebug(`❌ saveConfig 调用失败: ${saveErr.message}`);
        console.error('saveConfig 错误:', saveErr);
        throw saveErr;
      }
      
    } catch (err: any) {
      addDebug(`❌ 保存配置失败: ${err.message}`);
      console.error('保存配置完整错误:', err);
      console.error('错误堆栈:', err.stack);
    }
  };

  // ============ 渲染调试面板 ============
  const renderDebugPanel = () => (
    <Card 
      title="🔧 调试信息" 
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 12, maxHeight: 300, overflow: 'auto' }}
    >
      <div style={{ fontSize: 11, fontFamily: 'monospace', lineHeight: '1.5' }}>
        <div style={{ marginBottom: 8 }}>
          <Tag color={getStateColor(state)} size="small">{getStateName(state)}</Tag>
          <Tag color={sdkReady ? 'green' : 'red'} size="small">SDK: {sdkReady ? '就绪' : '未就绪'}</Tag>
          <Tag color="grey" size="small">表: {tables.length}</Tag>
          <Tag color="grey" size="small">记录: {records.length}</Tag>
          <Tag color="grey" size="small">字段: {fields.length}</Tag>
        </div>
        
        {/* 显示当前配置 */}
        {initialConfig?.customConfig?.recordId && (
          <div style={{ 
            marginBottom: 8, 
            padding: 6, 
            background: 'var(--semi-color-fill-0)', 
            borderRadius: 4,
            fontSize: 10
          }}>
            <div><strong>已保存配置:</strong></div>
            <div>表: {initialConfig.customConfig.tableId?.slice(-8)}</div>
            <div>记录: {initialConfig.customConfig.recordId?.slice(-8)}</div>
            <div>字段: {initialConfig.customConfig.fieldId?.slice(-8)}</div>
          </div>
        )}
        
        {debugInfo.map((info, idx) => (
          <div key={idx} style={{ 
            padding: '1px 0', 
            borderBottom: idx < debugInfo.length - 1 ? '1px solid var(--semi-color-border)' : 'none',
            color: info.includes('❌') ? 'var(--semi-color-danger)' : 
                   info.includes('✅') ? 'var(--semi-color-success)' : 
                   'var(--semi-color-text-0)'
          }}>
            {info}
          </div>
        ))}
      </div>
    </Card>
  );

  // ============ 渲染配置面板 ============
  const renderConfigPanel = () => (
    <div className="config-panel">
      {renderDebugPanel()}
      
      <Title heading={5} style={{ marginBottom: 16 }}>
        Markdown 渲染配置
      </Title>
      
      <Banner
        type="info"
        description="请选择数据表 → 选择记录 → 选择Markdown字段"
        style={{ marginBottom: 16 }}
      />
      
      <Form
        getFormApi={setFormApi}
        layout="vertical"
        onValueChange={(values) => {
          addDebug(`📝 表单值变化: tableId=${values.tableId}, fieldId=${values.fieldId}`);
          // 不要自动保存，让用户点击按钮保存
        }}
      >
        {/* 数据表选择 */}
        <Form.Select
          field="tableId"
          label="选择数据表"
          placeholder="请选择数据表"
          style={{ width: '100%' }}
          filter
          searchPlaceholder="搜索数据表..."
          optionList={tables.map((table) => ({
            label: table.name || '未命名表格',
            value: table.id,
          }))}
          onChange={(value: string | number | any[] | Record<string, any>) => {
            const tableId = String(value);
            addDebug(`📝 数据表选择变化: ${tableId}`);
            handleTableChange(tableId);
          }}
        />

        {/* 记录选择 */}
        <Form.Select
          field="recordId"
          label="选择记录"
          placeholder={records.length > 0 ? `请选择记录 (${records.length}条)` : '请先选择数据表'}
          style={{ width: '100%' }}
          disabled={records.length === 0}
          filter
          searchPlaceholder="搜索记录名称..."
          optionList={records.map((item) => ({
            label: item.displayName || '未命名记录',
            value: item.id,
          }))}
        />

        {/* 字段选择 */}
        <Form.Select
          field="fieldId"
          label="Markdown 字段"
          placeholder={fields.length > 0 ? `请选择字段 (${fields.length}个可用)` : '请先选择数据表'}
          style={{ width: '100%' }}
          disabled={fields.length === 0}
          filter
          searchPlaceholder="搜索字段..."
          optionList={fields.map((field) => {
            // 获取字段类型名称
            let typeName = '其他';
            if (field.type === FieldType.Text) typeName = '文本';
            else if (field.type === 1) typeName = '文本';
            else typeName = `类型${field.type}`;
            
            return {
              label: `${field.name} (${typeName})`,
              value: field.id,
            };
          })}
        />

        {/* 显示设置 */}
        <Divider />
        <Title heading={6} style={{ marginBottom: 12 }}>
          显示设置
        </Title>
        
        <Form.Switch
          field="showToc"
          label="显示目录"
          initValue={false}
        />
        
        <Form.Switch
          field="autoUpdate"
          label="数据变化时自动更新"
          initValue={true}
        />

        {/* 保存按钮 */}
        <div style={{ marginTop: 24 }}>
          <Button 
            type="primary" 
            theme="solid" 
            onClick={() => {
              // 手动验证表单
              formApi?.validate().then(() => {
                addDebug('✅ 表单验证通过');
                handleSave();
              }).catch((errors: any) => {
                addDebug('❌ 表单验证失败');
                console.log('验证错误:', errors);
              });
            }} 
            block
          >
            保存配置
          </Button>
        </div>
      </Form>
    </div>
  );

  // ============ 渲染内容区 ============
  const renderContent = () => {
    // 显示当前状态信息（展示状态和全屏状态不显示）
    const showStateInfo = state !== DashboardState.View && state !== DashboardState.FullScreen;
    
    const stateInfo = showStateInfo ? (
      <div style={{ marginBottom: 16, padding: 12, background: 'var(--semi-color-fill-0)', borderRadius: 6 }}>
        <Text strong>当前状态: </Text>
        <Tag color={getStateColor(state)} size="large">{getStateName(state)}</Tag>
        <Text style={{ marginLeft: 12, color: 'var(--semi-color-text-2)' }}>
          {!sdkReady ? 'SDK 未就绪' :
           state === DashboardState.Create ? '正在创建插件，请配置数据源' :
           state === DashboardState.Config ? '正在配置插件，修改右侧设置' :
           '等待初始化...'}
        </Text>
      </div>
    ) : null;

    if (loading) {
      return (
        <div className="content-center">
          {stateInfo}
          <Spin size="large" tip="加载中..." />
          <Text type="secondary" style={{ marginTop: 16 }}>
            正在从多维表格获取数据...
          </Text>
        </div>
      );
    }

    // 创建状态：显示引导
    if (state === DashboardState.Create) {
      return (
        <div className="content-center" style={{ flexDirection: 'column', padding: 24 }}>
          {stateInfo}
          <Empty
            title="欢迎使用 Markdown 渲染插件"
            description={
              <div style={{ textAlign: 'left', maxWidth: 400 }}>
                <Paragraph>👋 这是一个全新的插件，请先完成配置：</Paragraph>
                <ol style={{ paddingLeft: 20 }}>
                  <li>在右侧配置面板选择数据表</li>
                  <li>选择包含 Markdown 内容的文本字段</li>
                  <li>（可选）选择视图筛选数据范围</li>
                  <li>点击保存配置</li>
                </ol>
              </div>
            }
          />
        </div>
      );
    }

    // 配置状态：显示预览
    if (state === DashboardState.Config) {
      return (
        <div style={{ padding: 20 }}>
          {stateInfo}
          {!markdownContent ? (
            <Empty
              title="暂无预览内容"
              description="请在右侧配置数据源后，将显示 Markdown 预览"
            />
          ) : (
            <Card className="markdown-card" bodyStyle={{ padding: 24 }}>
              <div style={{ marginBottom: 16, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
                <Text type="secondary">👁️ 预览模式 - 配置完成后点击保存</Text>
              </div>
              <MarkdownRenderer content={markdownContent} />
            </Card>
          )}
        </div>
      );
    }

    // 展示/全屏状态
    if (!markdownContent) {
      console.log('【调试】展示状态 - markdownContent 为空');
      console.log('【调试】当前配置:', initialConfig);
      
      return (
        <div className="content-center" style={{ flexDirection: 'column' }}>
          {stateInfo}
          <Empty
            title="暂无内容"
            description="请检查数据源配置或数据是否存在"
          />
          <div style={{ marginTop: 24, padding: 16, background: 'var(--semi-color-fill-0)', borderRadius: 6, maxWidth: 400 }}>
            <Text strong>排查建议：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>检查数据表是否有数据</li>
              <li>检查选择的字段是否包含内容</li>
              <li>尝试重新配置数据源</li>
            </ul>
          </div>
          <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 4, maxWidth: 400 }}>
            <Text type="warning" size="small">
              💡 按 F12 打开控制台查看详细调试信息
            </Text>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: 20 }}>
        {stateInfo}
        <Card className="markdown-card" bodyStyle={{ padding: 24 }}>
          <MarkdownRenderer content={markdownContent} />
        </Card>
      </div>
    );
  };

  // ============ 主渲染 ============
  return (
    <Layout className="app-layout">
      {/* 主内容区 */}
      <Content className="app-content">
        {/* 顶部标题栏 - 展示状态和全屏状态隐藏 */}
        {state !== DashboardState.View && state !== DashboardState.FullScreen && (
          <div style={{ 
            padding: '12px 20px', 
            borderBottom: '1px solid var(--semi-color-border)',
            background: 'var(--semi-color-bg-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Title heading={6} style={{ margin: 0 }}>
              📄 Markdown 渲染器
            </Title>
            <Tag color={getStateColor(state)} size="small">
              {getStateName(state)}
            </Tag>
          </div>
        )}
        
        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderContent()}
        </div>
      </Content>

      {/* 配置面板 */}
      {(state === DashboardState.Config || state === DashboardState.Create) && (
        <Sider className="app-sider">
          {renderConfigPanel()}
        </Sider>
      )}
    </Layout>
  );
}

export default App;
