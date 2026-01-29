import React, { useEffect, useRef, useState } from 'react';
import {
    bitable,
    dashboard,
    DashboardState,
    IData,
    IDataItem,
    IDataCondition,
    workspace,
    bridge,
    IDashboard,
    FieldType,
    ITable,
    IGetRecordsParams,
    IRecord,
} from "@lark-base-open/js-sdk";
import { Button, ButtonGroup, ConfigProvider,DatePicker,Divider, Input, Select, Spin, Tooltip } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import "./i18n/index"
import { useTranslation } from "react-i18next";
import ReactMarkdown from 'react-markdown';

import 'github-markdown-css/github-markdown.css'


import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import enUS from '@douyinfe/semi-ui/lib/es/locale/source/en_US';

import classnames from 'classnames'
import classNames from 'classnames'
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import SettingIcon from "./SettingIcon";
import { IconsMap } from "./iconMap";
import BaseSelector from './components/BaseSelector';
import { CloseOutlined, FileTextFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { actDestroy } from 'antd/es/message';

interface IMileStoneConfig {
    title: string;
    dateType: 'text' | 'ref';
    iconType: "preset" | "custom"; // 自定义 预设
    presetIconIndex: number,
    customIcon: string;
    dateInfo: {
        tableId: string;
        fieldId: string;
        fieldName: string;
        dateType: 'earliest' | 'latest';
        baseToken?: string;
    };
    target: string;
    format: string;
    color: string;
    fontSize: number;
    filterValue: Array<FilterValue>;
    allFields: any[];
}

type FilterValue = { operator: FilterOperator; value: string; fieldId: string; fieldType: FieldType; }

type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'empty'
  | 'not_empty';

const filterTypeOperators = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'not_contains', label: '不包含' },
  { value: 'empty', label: '为空' },
  { value: 'not_empty', label: '不为空' },
];


const colors = ["#1F2329", "#1456F0", "#7A35F0", "#35BD4B", "#2DBEAB", "#FFC60A", "#FF811A", "#F54A45"]


dayjs.locale('zh-cn');


export function SelectRefDate({
  config,
  setConfig,
  isMultipleBase,
  fields,
  setFields,
}: {
  config: IMileStoneConfig;
  setConfig: any;
  isMultipleBase: boolean | undefined;
  fields: any[];
  setFields: any;
  
}) {
  const [tables, setTables] = React.useState<any[]>([]);
  
  const [tableLoading, setTableLoading] = React.useState<boolean>(false);
  const { t } = useTranslation()
  const baseHasChanged = useRef(false);

  const MIN = 11
  const MAX = 18

  const zoomOut = () => {
    setConfig({
      ...config,
      fontSize:  Math.max(MIN, config.fontSize - 1)
    })
    
  }

  const zoomIn = () => {
    setConfig({
      ...config,
      fontSize:  Math.min(MAX, config.fontSize + 1)
    })
  }

  async function getTables() {
    if (isMultipleBase && !config?.dateInfo?.baseToken) {
      return;
    }
    setTableLoading(true);
    const realBitable = isMultipleBase
      ? await workspace.getBitable(config.dateInfo.baseToken!)
      : bitable;
    let tables = (await realBitable?.base?.getTableMetaList()) || [];
    setTables(tables);
    console.log('-------------------------', tables);
    
    if (baseHasChanged.current || (!config?.dateInfo?.tableId || !config?.dateInfo?.fieldId)) {
      if (tables && tables.length > 0) {
        let targetTableId = tables[0].id
        let fields: any = []
        let targetFieldId = ""
        let targetFieldName = ""
        console.log('-------------------------', tables);
        let all
        for (let table_info of tables) {
          // console.log("表格",table_info)
          let table = await realBitable?.base?.getTableById(table_info.id);
          all = (await table?.getFieldMetaList()) || [];
          console.log("所有字段111111", all)
          setConfig({
            ...config,
            allFields: all
          })
          console.log("所有字段222222", config)
          let dateFields = all.filter((item) => item.type === 1 )
          if (dateFields && dateFields.length > 0) {
            fields = dateFields
            targetTableId = table_info.id
            targetFieldId = dateFields[0].id
            targetFieldName = dateFields[0].name
            // console.log("找到字段", dateFields[0])
            
            break
          }
        }
        if (fields.length > 0) {
          console.log("找到字段", config)
          setFields(fields)
          setConfig({
            ...config,
            allFields: all,
            dateInfo: {
              ...config.dateInfo,
              tableId: targetTableId,
              fieldId: targetFieldId,
              fieldName: targetFieldName,
              dateType: 'earliest'
            }
          })
          console.log('-------------------------', config, 'allFields');
          
        }
      }
    }

    if (config.dateType === 'ref' && config.dateInfo.tableId) {
            // console.log("you have table id")
            getDateFields(config.dateInfo.tableId);
    }

    setTableLoading(false);
  }

  const getBaseToken = async () => {
    if (config?.dateInfo?.baseToken) {
      return;
    }
    const baseList = await workspace.getBaseList({
      query: "",
      page: {
        cursor: "",
      },
    });
    const initialBaseToken = baseList?.base_list?.[0]?.token || "";
    setConfig({
      ...config,
      dateInfo: {
        ...config.dateInfo,
        baseToken: initialBaseToken,
      },
    });
  };

  React.useEffect(() => {
    (async () => {
      if (isMultipleBase) {
        getBaseToken();
      }
    })();
  }, [isMultipleBase]);

  React.useEffect(() => {
    if (
      isMultipleBase === undefined ||
      (isMultipleBase && !config?.dateInfo?.baseToken)
    ) {
      return;
    }
    if (baseHasChanged.current) {
      setConfig((prev: IMileStoneConfig) => ({
        ...prev,
        dateInfo: {
          ...prev.dateInfo,
          tableId: "",
          fieldId: "",
          fieldName: "",
          dateType: "earliest",
        },
      }));
    }
    getTables();
  }, [config?.dateInfo?.baseToken, isMultipleBase]);

  async function getDateFields(table_id: string): Promise<{ fields: any[]; all: any[] }> {
    // console.log("获取", table_id);
    if (isMultipleBase && !config?.dateInfo?.baseToken) {
      return { fields: [], all: [] };
    }
    const realBitable = isMultipleBase
      ? await workspace.getBitable(config.dateInfo.baseToken!)
      : bitable;
    let table = await realBitable?.base?.getTableById(table_id);
    let all = (await table?.getFieldMetaList()) || [];
    let fields = all.filter(
      // (item) => item.type === 5 || item.type === 1001 || item.type === 1002
      (item) => item.type === 1
    );
    console.log("所有字段", all)
    setFields(fields);
    setConfig({
      ...config,
      dateInfo: {
        ...config.dateInfo,
        tableId: table_id,
      },
      allFields: all
    });
    return {
      fields,
      all
    };
  }

  return (
    <div>
      {isMultipleBase && (
        <div className={"form-item"}>
          <BaseSelector
            baseToken={config.dateInfo.baseToken!}
            onChange={(v) => {
              setConfig({
                ...config,
                dateInfo: {
                  ...config.dateInfo,
                  baseToken: v,
                },
              })
              baseHasChanged.current = true;
            }
            }
          />
        </div>
      )}
  <div className={'form-item'}>
            <div className={'label'} style={{ marginTop: 8 }}>{t("数据源")}</div>
            <Select
                onChange={async (v) => {
                    const { fields, all } = await getDateFields(v as string);
                    console.log('22222222', fields);
                    
                    setTimeout(() => {
                      setConfig({
                        ...config,
                        dateInfo: {
                            ...config.dateInfo,
                            tableId: v,
                            fieldId: fields?.[0] ? fields[0].id : "",
                            fieldName: fields?.[0] ? fields[0].name : "",
                            dateType: 'earliest'
                        },
                        allFields: all,
                        filterValue: [],
                    })
                    }, 10)
                }}
                value={tables.find(item => item.id === config.dateInfo.tableId) ? config.dateInfo.tableId : ""}
                style={{
                    width: "100%"
                }}
                placeholder={t('请选择数据源')}
                optionList={tables.map(item => {
                    return {
                        label: <div style={{
                            display: "flex",
                            alignItems: "center"
                        }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M1.33203 2.66634C1.33203 1.92996 1.92898 1.33301 2.66536 1.33301H13.332C14.0684 1.33301 14.6654 1.92996 14.6654 2.66634V13.333C14.6654 14.0694 14.0684 14.6663 13.332 14.6663H2.66536C1.92899 14.6663 1.33203 14.0694 1.33203 13.333V2.66634ZM2.66536 2.66634V13.333H13.332V2.66634H2.66536Z"
                                    fill="var(--icon-color)" />
                                <path
                                    d="M8.33203 4.66634C7.96384 4.66634 7.66536 4.96482 7.66536 5.33301C7.66536 5.7012 7.96384 5.99967 8.33203 5.99967H11.332C11.7002 5.99967 11.9987 5.7012 11.9987 5.33301C11.9987 4.96482 11.7002 4.66634 11.332 4.66634H8.33203Z"
                                    fill="var(--icon-color)" />
                                <path
                                    d="M3.9987 5.33301C3.9987 4.96482 4.29718 4.66634 4.66536 4.66634H5.9987C6.36689 4.66634 6.66536 4.96482 6.66536 5.33301C6.66536 5.7012 6.36689 5.99967 5.9987 5.99967H4.66536C4.29717 5.99967 3.9987 5.7012 3.9987 5.33301Z"
                                    fill="var(--icon-color)" />
                                <path
                                    d="M8.33203 7.33301C7.96384 7.33301 7.66536 7.63148 7.66536 7.99967C7.66536 8.36786 7.96384 8.66634 8.33203 8.66634H11.332C11.7002 8.66634 11.9987 8.36786 11.9987 7.99967C11.9987 7.63148 11.7002 7.33301 11.332 7.33301H8.33203Z"
                                    fill="var(--icon-color)" />
                                <path
                                    d="M3.9987 7.99967C3.9987 7.63148 4.29718 7.33301 4.66536 7.33301H5.9987C6.36689 7.33301 6.66536 7.63148 6.66536 7.99967C6.66536 8.36786 6.36689 8.66634 5.9987 8.66634H4.66536C4.29717 8.66634 3.9987 8.36786 3.9987 7.99967Z"
                                    fill="var(--icon-color)" />
                                <path
                                    d="M8.33203 9.99967C7.96384 9.99967 7.66536 10.2982 7.66536 10.6663C7.66536 11.0345 7.96384 11.333 8.33203 11.333H11.332C11.7002 11.333 11.9987 11.0345 11.9987 10.6663C11.9987 10.2982 11.7002 9.99967 11.332 9.99967H8.33203Z"
                                    fill="var(--icon-color)" />
                                <path
                                    d="M3.9987 10.6663C3.9987 10.2982 4.29718 9.99967 4.66536 9.99967H5.9987C6.36689 9.99967 6.66536 10.2982 6.66536 10.6663C6.66536 11.0345 6.36689 11.333 5.9987 11.333H4.66536C4.29717 11.333 3.9987 11.0345 3.9987 10.6663Z"
                                    fill="var(--icon-color)" />
                            </svg>
                            <div style={{ marginLeft: 2 }}>
                                {item.name}
                            </div>
                        </div>,
                        value: item.id,
                    }
                })} 
                renderSelectedItem={tableLoading ? () => <Spin /> : undefined}
            />
        </div>
        <div className={'form-item'}>
            <div className={'label'}>
                {t('文本字段')}
            </div>
            <Select
                style={{
                    width: "100%"
                }}
                onChange={v => {
                    // console.log('selected field', v);
                    const selectedField = fields.find(item => item.id === v);
                    setConfig({
                        ...config,
                        dateInfo: {
                            ...config.dateInfo,
                            fieldId: v,
                            fieldName: selectedField?.name || ""
                        }
                    })
                }}
                value={fields.find(item => item.id === config.dateInfo.fieldId) ? config.dateInfo.fieldId : ""}
                placeholder={t('请选择文本字段')}
                optionList={fields.map(item => {
                    return {
                        label: (<div style={{
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M4.66536 1.33301C5.03355 1.33301 5.33203 1.63148 5.33203 1.99967H10.6654C10.6654 1.63148 10.9638 1.33301 11.332 1.33301C11.7002 1.33301 11.9987 1.63148 11.9987 1.99967C12.2748 1.99967 12.8119 1.99967 13.3321 1.99967C14.0684 1.99967 14.6654 2.59663 14.6654 3.33301V13.333C14.6654 14.0694 14.0684 14.6663 13.332 14.6663H2.66536C1.92899 14.6663 1.33203 14.0694 1.33203 13.333L1.33203 3.33301C1.33203 2.59663 1.92896 1.99967 2.66534 1.99967C3.18554 1.99967 3.72257 1.99967 3.9987 1.99967C3.9987 1.63148 4.29717 1.33301 4.66536 1.33301ZM10.6654 3.33301H5.33203C5.33203 3.7012 5.03355 3.99967 4.66536 3.99967C4.29717 3.99967 3.9987 3.7012 3.9987 3.33301H2.66536V13.333H13.332V3.33301H11.9987C11.9987 3.7012 11.7002 3.99967 11.332 3.99967C10.9638 3.99967 10.6654 3.7012 10.6654 3.33301ZM5.9987 9.99967C5.9987 9.63148 5.70022 9.33301 5.33203 9.33301H4.66536C4.29717 9.33301 3.9987 9.63149 3.9987 9.99967V10.6663C3.9987 11.0345 4.29717 11.333 4.66536 11.333H5.33203C5.70022 11.333 5.9987 11.0345 5.9987 10.6663V9.99967ZM6.9987 6.66634C6.9987 6.29815 7.29718 5.99967 7.66536 5.99967H8.33203C8.70022 5.99967 8.9987 6.29815 8.9987 6.66634V7.33301C8.9987 7.7012 8.70022 7.99967 8.33203 7.99967H7.66536C7.29717 7.99967 6.9987 7.7012 6.9987 7.33301V6.66634ZM8.9987 9.99967C8.9987 9.63148 8.70022 9.33301 8.33203 9.33301H7.66536C7.29717 9.33301 6.9987 9.63149 6.9987 9.99967V10.6663C6.9987 11.0345 7.29718 11.333 7.66536 11.333H8.33203C8.70022 11.333 8.9987 11.0345 8.9987 10.6663V9.99967ZM9.9987 9.99967C9.9987 9.63148 10.2972 9.33301 10.6654 9.33301H11.332C11.7002 9.33301 11.9987 9.63149 11.9987 9.99967V10.6663C11.9987 11.0345 11.7002 11.333 11.332 11.333H10.6654C10.2972 11.333 9.9987 11.0345 9.9987 10.6663V9.99967ZM11.9987 6.66634C11.9987 6.29815 11.7002 5.99967 11.332 5.99967H10.6654C10.2972 5.99967 9.9987 6.29815 9.9987 6.66634V7.33301C9.9987 7.7012 10.2972 7.99967 10.6654 7.99967H11.332C11.7002 7.99967 11.9987 7.7012 11.9987 7.33301V6.66634Z"
                                    fill="var(--icon-color)" />
                            </svg>
                            <div style={{ marginLeft: 2 }}>
                                {item.name}
                            </div>
                        </div>),
                        value: item.id,
                    }
                })}
                renderSelectedItem={tableLoading ? () => <Spin /> : undefined}
            >

            </Select>
        </div>
        <div className={'form-item'}>
            <div className={'label'}>
                {t('字体大小')}
            </div>
            <ButtonGroup>
              <Tooltip content={ t('缩小字号') }>
                <Button
                  icon={<MinusOutlined />}
                  onClick={zoomOut}
                  size="small"
                />
              </Tooltip>

              <Button size="small" disabled>
                {config.fontSize}px
              </Button>

              <Tooltip content={ t('放大字号') }>
                <Button
                  icon={<PlusOutlined />}
                  onClick={zoomIn}
                  size="small"
                />
              </Tooltip>
            </ButtonGroup>
        </div>
        <div className={'form-item'}>
            <div className={'label'}>
                {t('数据过滤')}
            </div>
            
            <div className={'filter-container'}>
              { config.filterValue?.map((item: FilterValue, index: number) => {
                return (
                  <div className={'filter-item'}>
                  <Select
                    style={{
                        width: 120
                    }}
                    onChange={v => {
                        const array = [...config.filterValue || []]
                        array[index] = {
                            ...array[index],
                            fieldId: v as string
                        }
                        setConfig({
                        ...config,
                        filterValue: array
                    })
                    }}
                    value={config.filterValue[index]?.fieldId || ""}
                    placeholder={t('请选择过滤字段')}
                    optionList={config.allFields.map(item => {
                        return {
                            label: (<div style={{
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M4.66536 1.33301C5.03355 1.33301 5.33203 1.63148 5.33203 1.99967H10.6654C10.6654 1.63148 10.9638 1.33301 11.332 1.33301C11.7002 1.33301 11.9987 1.63148 11.9987 1.99967C12.2748 1.99967 12.8119 1.99967 13.3321 1.99967C14.0684 1.99967 14.6654 2.59663 14.6654 3.33301V13.333C14.6654 14.0694 14.0684 14.6663 13.332 14.6663H2.66536C1.92899 14.6663 1.33203 14.0694 1.33203 13.333L1.33203 3.33301C1.33203 2.59663 1.92896 1.99967 2.66534 1.99967C3.18554 1.99967 3.72257 1.99967 3.9987 1.99967C3.9987 1.63148 4.29717 1.33301 4.66536 1.33301ZM10.6654 3.33301H5.33203C5.33203 3.7012 5.03355 3.99967 4.66536 3.99967C4.29717 3.99967 3.9987 3.7012 3.9987 3.33301H2.66536V13.333H13.332V3.33301H11.9987C11.9987 3.7012 11.7002 3.99967 11.332 3.99967C10.9638 3.99967 10.6654 3.7012 10.6654 3.33301ZM5.9987 9.99967C5.9987 9.63148 5.70022 9.33301 5.33203 9.33301H4.66536C4.29717 9.33301 3.9987 9.63149 3.9987 9.99967V10.6663C3.9987 11.0345 4.29717 11.333 4.66536 11.333H5.33203C5.70022 11.333 5.9987 11.0345 5.9987 10.6663V9.99967ZM6.9987 6.66634C6.9987 6.29815 7.29718 5.99967 7.66536 5.99967H8.33203C8.70022 5.99967 8.9987 6.29815 8.9987 6.66634V7.33301C8.9987 7.7012 8.70022 7.99967 8.33203 7.99967H7.66536C7.29717 7.99967 6.9987 7.7012 6.9987 7.33301V6.66634ZM8.9987 9.99967C8.9987 9.63148 8.70022 9.33301 8.33203 9.33301H7.66536C7.29717 9.33301 6.9987 9.63149 6.9987 9.99967V10.6663C6.9987 11.0345 7.29718 11.333 7.66536 11.333H8.33203C8.70022 11.333 8.9987 11.0345 8.9987 10.6663V9.99967ZM9.9987 9.99967C9.9987 9.63148 10.2972 9.33301 10.6654 9.33301H11.332C11.7002 9.33301 11.9987 9.63149 11.9987 9.99967V10.6663C11.9987 11.0345 11.7002 11.333 11.332 11.333H10.6654C10.2972 11.333 9.9987 11.0345 9.9987 10.6663V9.99967ZM11.9987 6.66634C11.9987 6.29815 11.7002 5.99967 11.332 5.99967H10.6654C10.2972 5.99967 9.9987 6.29815 9.9987 6.66634V7.33301C9.9987 7.7012 10.2972 7.99967 10.6654 7.99967H11.332C11.7002 7.99967 11.9987 7.7012 11.9987 7.33301V6.66634Z"
                                        fill="var(--icon-color)" />
                                </svg>
                                <div style={{ marginLeft: 2 }}>
                                    {item.name}
                                </div>
                            </div>),
                            value: item.id,
                        }
                    })}
                    renderSelectedItem={tableLoading ? () => <Spin /> : undefined}
                >

                </Select>
                <Select
                    style={{
                        width: 90
                    }}
                    onChange={v => {
                        const array = [...config.filterValue || []]
                        array[index] = {
                            ...array[index],
                            operator: v as FilterOperator
                        }
                        setConfig({
                        ...config,
                        filterValue: array
                    })
                    }}
                    value={config.filterValue[index]?.operator || ""}
                    placeholder={t('请选择')}
                    optionList={filterTypeOperators}
                >

                </Select>
                  {
                    [FieldType.ModifiedTime, FieldType.CreatedTime, FieldType.DateTime].includes(config.allFields.find(el => el.id === item.fieldId)?.type) 
                    ? 
                    <DatePicker value={filterTodayOrYesterday(config.filterValue[index]?.value, config)} onChange={v => {
                          const array = [...config.filterValue || []];
                          array[index] = {
                            ...array[index],
                            value: v ? dayjs(v as Date).format(config.format) : ''
                          };
                          setConfig({
                            ...config,
                            filterValue: array
                          });
                        } } style={{ flex: 1 }} bottomSlot={<BottomSlot onCheck={ (v: 'today' | 'yesterday') => {
                          const array = [...config.filterValue || []];
                           array[index] = {
                            ...array[index],
                            value: v
                          };
                          setConfig({
                            ...config,
                            filterValue: array
                          });
                        } } /> } />
                    :
                    <Input placeholder={t(`请输入`)} value={config.filterValue[index]?.value} onChange={v => {
                          const array = [...config.filterValue || []];
                          array[index] = {
                            ...array[index],
                            value: v
                          };
                          setConfig({
                            ...config,
                            filterValue: array
                          });
                        } } style={{ flex: 1 }}></Input>
                  }
                  <CloseOutlined className={'close-icon'} onClick={() => {
                          const array = [...config.filterValue || []];
                          array.splice(index, 1);
                          setConfig({
                            ...config,
                            filterValue: array
                          });
                        } } />
                </div>
              )
            }) }
            <Button icon={<PlusOutlined />} onClick={() => {
              setConfig({
                ...config,
                filterValue: [...config.filterValue || [], {
                  fieldId: fields[0]?.id || "",
                  operator: "eq",
                  value: ""
                }]
              })
            }}>{t('添加过滤条件')}</Button>
            </div>
        </div>

    </div>)

}

function BottomSlot(props: { onCheck: (v: 'today' | 'yesterday') => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', padding: '8px 12px' }}>
          <Button type="tertiary" size="small" onClick={() => props.onCheck('yesterday')}>昨天</Button>
          <Button type="tertiary" size="small" onClick={() => props.onCheck('today')}>今天</Button>
        </div>
    );
};

export default function App() {
  const [locale, setLocale] = useState(zhCN);
  const { t } = useTranslation()
 const [config, setConfig] = useState<IMileStoneConfig>({
        title: t("文本转换"),
        color: colors[0],
        dateType: 'text',
        iconType: 'preset',
        presetIconIndex: 1,
        customIcon: "",
        dateInfo: {
            tableId: '',
            fieldId: '',
            dateType: 'earliest',
            fieldName: ''
        },
        target: "",
        format: 'YYYY-MM-DD',
        fontSize: 13,
        filterValue: [],
        allFields: [],
    })
  const [theme, setTheme] = useState('LIGHT')
  const [fields, setFields] = React.useState<any[]>([]);
  const [isMultipleBase, setIsMultipleBase] = useState<boolean | undefined>(
    undefined
  );
  const dashboardRef = useRef<IDashboard>(dashboard);

  useEffect(() => {
    (async () => {
      const env = await bridge.getEnv();
      setIsMultipleBase(env.needChangeBase ?? false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!isMultipleBase) {
        return;
      }
      const workspaceBitable = await workspace.getBitable(
        config.dateInfo.baseToken!
      );
      const workspaceDashboard = workspaceBitable?.dashboard || dashboard;
      dashboardRef.current = workspaceDashboard;
    })();
  }, [config.dateInfo.baseToken, isMultipleBase]);

  const isCreate = dashboardRef.current.state === DashboardState.Create;
  /** 是否配置模式下 */
  const isConfig = dashboardRef.current.state === DashboardState.Config || isCreate;

    const changeDateType = (type: 'text' | 'ref') => {
        let dateInfo: any = {}
        if (type === 'text') {
        }
        if (type === 'ref') {
            dateInfo = {
                tableId: '',
                fieldId: '',
                dateType: 'earliest'
            }
        }
        setConfig({
            ...config,
            dateType: type,
            dateInfo
        })
    }
    const changeLang = (lang: 'en-us' | 'zh-CN') => {
        if (lang === 'zh-CN') {
            setLocale(zhCN);
            dayjs.locale('zh-cn');
        } else {
            setLocale(enUS);
            dayjs.locale('en-ud');
        }
    }

   useEffect(() => {
        bitable.bridge.getLocale().then((lang) => {
            changeLang(lang as any)
        })

        function changeTheme({ theme, bgColor }: { theme: string, bgColor: string }) {
            if (!isConfig) {
                return
            }
            const body = document.querySelector('body');
            if (theme === 'DARK') {
                // @ts-ignore
                body.setAttribute('theme-mode', 'dark');
                setTheme('DARK')
            } else {
                // @ts-ignore
                body.removeAttribute('theme-mode');
                setTheme('LIGHT')
            }
            // @ts-ignore
            body.style.setProperty('--bg-color', bgColor);
        }

        dashboardRef.current.getTheme().then((theme) => {
            // @ts-ignore
            changeTheme({ theme: theme.theme, bgColor: theme.chartBgColor });
        })
        dashboardRef.current.onThemeChange(res => {
            // console.log("them 变化", res)
            changeTheme({ theme: res.data.theme, bgColor: res.data.chartBgColor });
        });

        // bitable.bridge.getTheme().then((theme) => {
        //     console.log("theme", theme)
        //     changeTheme(theme)
        // })
        // bitable.bridge.onThemeChange((res) => {
        //     changeTheme(res.data.theme)
        // })

    }, [])

  const updateConfig = (res: any) => {
    const { customConfig, dataConditions } = res;
    const baseToken = dataConditions?.[0]?.baseToken
    if (customConfig) {
      setConfig((pre) => {
        const tempConfig = {
          ...pre,
          ...customConfig,
        }
        return {
          ...tempConfig,
          dateInfo: {
            ...tempConfig.dateInfo,
            baseToken
          }
        };
      });
      setTimeout(() => {
        // 预留3s给浏览器进行渲染，3s后告知服务端可以进行截图了
        dashboardRef.current.setRendered();
      }, 3000);
    }
  }

  React.useEffect(() => {
    if (isCreate) {
      return
    }
    // 初始化获取配置
    dashboardRef.current.getConfig().then(updateConfig);
  }, []);


  React.useEffect(() => {
    const offConfigChange = dashboardRef.current.onConfigChange((r) => {
      // console.log('====onConfigChange', r)
      // 监听配置变化，协同修改配置
      updateConfig(r.data);
    });
    return () => {
      offConfigChange();
    }
  }, []);

  const onClick = () => {
    // 保存配置
    // console.log("保存配置", config)
    let dataConditions: IDataCondition[] | null = []
    if (config.dateType === 'ref') {
      dataConditions = [
        {
          tableId: config.dateInfo.tableId,
          groups: [
            {
              fieldId: config.dateInfo.fieldId,
            }
          ],
          baseToken: config.dateInfo.baseToken,
        }
      ];
    }
    dashboardRef.current.saveConfig({
      customConfig: config,
      dataConditions: dataConditions,
    } as any)
  };
  const [update, setUpdate] = useState(0);
  useEffect(() => {
    if (
      dashboardRef.current.state === DashboardState.FullScreen ||
      dashboardRef.current.state === DashboardState.View
    ) {
      setInterval(() => {
        setUpdate(Math.random());
        dashboardRef.current.setRendered();
      }, 1000 * 30)
    }
  }, [])

  return (
       <main className={classnames({
            'main-config': isConfig,
            'main': true,
        })}>

            <ConfigProvider locale={locale}>

                <div className='content'>
                    <MileStone key={update} config={config} isConfig={isConfig} fields={fields} />
                </div>
                {
                    isConfig && (
                        <div className='config-panel'>
                            <div className='form'>
                                <div className='form-item'>
                                    <div className='label'>{t("文本标题")}</div>
                                    <Input
                                        value={config.title}
                                        onChange={(v) => {
                                            setConfig({
                                                ...config,
                                                title: v
                                            })
                                        }} />
                                </div>
                                <div className='form-item'>
                                    <div className={'label'}>{t('文本')}</div>
                                    <div className={'common-wrap'}>
                                        <div style={{
                                            color: 'var(--small-title-text-color)',
                                            fontSize: 12,
                                        }}>
                                            {t('选择文本')}
                                        </div>
                                        <div className={'tab-wrap'}>
                                            <div
                                                onClick={() => changeDateType('text')}
                                                className={classNames({
                                                    'active': config.dateType === 'text',
                                                    'tab-item': true,
                                                })}>
                                                {t('指定文本')}
                                            </div>
                                            <div
                                                onClick={() => changeDateType('ref')}
                                                className={classNames({
                                                    'active': config.dateType === 'ref',
                                                    'tab-item': true,
                                                })}>
                                                {t('选择文本')}
                                            </div>
                                        </div>
                                        {config.dateType === 'text' && (
                                                <div>
                                                    <Input
                                                        style={{ width: '100%', marginTop: 8 }}
                                                        value={config.title}
                                                        onChange={(value) => {
                                                            setConfig({
                                                                ...config,
                                                                target: value,
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            )}

                                        {
                                            config.dateType === 'ref' && (
                                                <SelectRefDate config={config} setConfig={setConfig} isMultipleBase={isMultipleBase} fields={fields} setFields={setFields} />
                                            )
                                        }
                                    </div>
                                </div>

                        
                                <Divider margin={10} />

                                <SettingIcon theme={theme} config={config} setConfig={setConfig} />

                          

                            </div>

                            <Button
                                className='btn'
                                type="primary"
                                autoInsertSpace={false}
                                onClick={onClick}
                            >
                                {t('确定')}
                            </Button>
                        </div>
                    )
                }
            </ConfigProvider>

        </main>
    )
}

function MarkdownView({ md, fontSize }: { md: string; fontSize: number }) {
  console.log('MarkdownView', md, fontSize);
    return (
        <div className="markdown-body" style={{ fontSize: `${fontSize}px` }}>
            <ReactMarkdown>
                {md}
            </ReactMarkdown>
        </div>

    );
}


function MileStone({ config, isConfig, fields }: {
    config: IMileStoneConfig,
    isConfig: boolean;
    fields: any[];
}) {
  console.log('所有字段22', config.allFields);
  

    const { title, format, color, target } = config
    const [time, setTime] = useState("")
    const [diffDay, setDiffDay] = useState(0)
    const { t } = useTranslation()
    const [theme, setTheme] = useState('LIGHT')

    const [md, setMd] = useState('');
    const [tableData, setTableData] = useState<IRecord[]>([]);

  const dashboardRef = useRef<IDashboard>(dashboard);

  useEffect(() => {
    (async () => {0
      const workspaceBitable = await workspace.getBitable(
        config.dateInfo.baseToken!
      );
      const workspaceDashboard = workspaceBitable?.dashboard || dashboard;
      dashboardRef.current = workspaceDashboard;
    })();
  }, [config.dateInfo.baseToken]);

    useEffect(() => {
        setDiffDay(Math.ceil((new Date(time).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    }, [time])

   useEffect(() => {

        function changeTheme({ theme, bgColor }: { theme: string, bgColor: string }) {
            const body = document.querySelector('body');
            if (theme === 'DARK') {
                // @ts-ignore
                body.setAttribute('theme-mode', 'dark');
                setTheme('DARK')

            } else {
                // @ts-ignore
                body.removeAttribute('theme-mode');
                setTheme('LIGHT')
            }

            // 设置 style 的变量
            // console.log("bgColor", bgColor)
            // @ts-ignore
            body.style.setProperty('--bg-color', bgColor);
        }

        dashboardRef.current.getTheme().then((theme) => {
            // console.log("them 变化111", theme, theme.theme)
            // @ts-ignore
            changeTheme({ theme: theme.theme, bgColor: theme.chartBgColor });
        })
        dashboardRef.current.onThemeChange(res => {
            // console.log("them 变化", res)
            changeTheme({ theme: res.data.theme, bgColor: res.data.chartBgColor });
        });

        // bitable.bridge.getTheme().then((theme) => {
        //     console.log("theme", theme)
        //     changeTheme(theme)
        // })
        //
        // bitable.bridge.onThemeChange((r) => {
        //     let theme = r.data.theme
        //     changeTheme(theme)
        // })
    }, [])

  useEffect(() => {
    setTime("")
   const getMaxMinTimeFromData = (data: IData) => {
            let maxDate = data[1][0].value as number, minDate = data[1][0].value as number;
            let maxTimeFormat = "";
            let minTimeFormat = "";

            for (let i = 1; i < data.length; i++) {
                const d = data[i][0].value as number;
                if (d) {
                    maxDate = Math.max(maxDate, d)
                    minDate = Math.min(minDate, d)
                }
            }

            minTimeFormat = dayjs(minDate).format(format)
            maxTimeFormat = dayjs(maxDate).format(format)
            return {
                maxTimeFormat,
                minTimeFormat,
                maxDate,
                minDate,
            }
        }

    async function getTime() {
      
      let data: IData = [];
      let tableId = config.dateInfo.tableId
      let fieldId = config.dateInfo.fieldId
      let dateType = config.dateInfo.dateType;
      console.log("====getTime", config, fields, {
          tableId: tableId,
          groups: fields.map(field => ({ fieldId: field.id })),
        })


        // if (isConfig) {
          async function getAllRecords(table: ITable) {
            let pageToken: string | undefined
            const allRecords = []

            do {
              const res = await table.getRecords({
                pageToken,
                pageSize: 500,
              })

              allRecords.push(...res.records)
              pageToken = res.pageToken
            } while (pageToken)

            return allRecords
          }
          const table = await bitable.base.getTableById(tableId)
          const datas = await getAllRecords(table);
          setTableData(datas)

          // data = await dashboardRef.current.getPreviewData({
          //   tableId: tableId,
          //   // groups: fields.map(field => ({ fieldId: field.id })),
          // });
          // data = await dashboardRef.current.getData()

          console.log("====getTime - 预览数据", data, datas);
          
      // } else {
      //   data = await dashboardRef.current.getData()
      //   console.log('====getTime - 非预览模式getData', data)
      //   if (data.length) {
      //     // 2. 取该列
      //     setTableData(data as any)
      //   }else {
      //     setTableData([])
      //   }
      // }
      
      

      // const { maxTimeFormat, minTimeFormat, maxDate, minDate } = getMaxMinTimeFromData(data)

      // let time = ''

      // if (dateType === 'earliest') {
      //   time = minTimeFormat
      // } else {
      //   time = maxTimeFormat
      // }
      // // console.log("====getTime 重新设置数据的时间", time)
      setTimeout(() => {
        setTime(dayjs(time).format(format))
      }, 300);
      // await dashboardRef.current.setRendered()
    }

    function loadTimeInfo(type: string) {
      if (config.dateType === "ref") {
        getTime()
      } else {
        setTime(config.target ? dayjs(config.target).format(config.format) : '')
      }
    }

    loadTimeInfo('====useEffect')
    

    // @ts-ignore;
    window._loadTimeInfo = loadTimeInfo;
    // @ts-ignore;
    window._dashboard = dashboardRef.current;
    let off = dashboardRef.current.onDataChange((r) => {
      // console.log("====onDataChange触发", r);// TODO 由saveConfig触发的此回调。这个时机触发的n（n可能有几十秒），onDataChange拿到的数据，以及调用getData拿到的数据还是旧的
      setTimeout(() => {
        loadTimeInfo('===onDataChange 延迟1s触发');
      }, 1000);
      if (config.dateType === "ref") {
      //     let info = r.data
      //     const { maxTimeFormat, minTimeFormat, maxDate, minDate } = getMaxMinTimeFromData(info)
      //     const time = config.dateInfo.dateType === 'earliest' ? minTimeFormat : maxTimeFormat
      //     console.log("data change,时间", time)
          setTime(dayjs().format(format))
      }
    })
    return () => {
      off()
    }
  }, [
    config.dateType,
    config.dateInfo.tableId,
    config.dateInfo.baseToken,
    config.dateInfo.dateType,
    config.target,
    config.format,
    isConfig,
    config.allFields,
  ]
)


useEffect(() => {
  if(config.dateType !== 'ref') return
  console.log('所有字段', config.allFields, JSON.stringify(config.allFields), config);
  
  const filteredData =filterRecordsByFieldValue(tableData, config.filterValue, config.allFields.reduce((acc, field) => {
    acc[field.id] = field.type;
    return acc;
  }, {} as Record<string, FieldType>), config)
  if(filteredData.length === 0) {
    setMd(`> ${t('没有匹配的数据')}`)
  } else if(filteredData.length === 1) {
    const cellValue = filteredData[0].fields[config.dateInfo.fieldId];
    const md = Array.isArray(cellValue) ? cellValue.map((value) => value?.text ?? value?.value ?? value?.name ?? '').join('\n') : cellValue?.text ?? cellValue?.value ?? cellValue?.name ?? cellValue;
    setMd(md)
  } else {
    setMd(`> ${t('请输入更多的数据过滤条件来过滤数据')}`)
  }
}, [tableData, config.filterValue, config.dateInfo.fieldId, config.allFields])
    
    // if(config.dateType === 'ref' && time) {
    //     return <MarkdownView md={md} fontSize={config.fontSize} />
    // }


   return (
        <Spin spinning={!time}>
          {
            config.dateType === 'ref' && time 
            ? 
            <MarkdownView md={md} fontSize={config.fontSize} />
            : 
            <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center"
                }}>
                    <div style={{
                        position: "relative",
                        width: `${isConfig ? "16vmin" : "16vmax"}`,
                        height: `${isConfig ? "16vmin" : "16vmax"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        {config.iconType === "custom" && config.customIcon && <img style={{ width: "93%" }} src={URL.createObjectURL(new Blob([config.customIcon], { type: 'image/svg+xml' }))} />}

                        {/*<svg style={{*/}
                        {/*    width: `${isConfig ? "16vmin" : "16vmax"}`,*/}
                        {/*    height: "auto"*/}
                        {/*}} width="91" height="90" viewBox="0 0 91 90" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
                        {/*    <rect x="0.5" width="90" height="90" rx="20"*/}
                        {/*          fill={(color === "#1F2329" && theme === "DARK") ? "#FFF" : color} fill-opacity="0.1"/>*/}
                        {/*    <path*/}
                        {/*        d="M67.8286 39.125C63.9929 39.7571 57.7357 39.9286 53.5786 32.0429C49.1214 23.5679 41.9214 23.3107 37.7107 24.0821C35.6643 24.4571 34.1321 26.1714 34.1321 27.8321V48.8964C35.3429 49.3571 36.6393 48.875 36.9714 48.8107C37.0571 48.7893 37.1321 48.7786 37.2286 48.7571C39.9071 48.1679 42.7357 47.8893 49.7429 51.2536C58.5286 55.4643 66.2214 47.7071 69.2 42.3071C69.4143 41.9321 70.1321 40.1429 70.1321 38.4286C69.0929 38.8571 67.8286 39.125 67.8286 39.125ZM31.5714 23H29.8571C29.3857 23 29 23.3857 29 23.8571V70.1429C29 70.6143 29.3857 71 29.8571 71H31.5714C32.0429 71 32.4286 70.6143 32.4286 70.1429V23.8571C32.4286 23.3857 32.0429 23 31.5714 23Z"*/}
                        {/*        fill={(color === "#1F2329" && theme === "DARK") ? "#FFF" : color}/>*/}
                        {/*</svg>*/}

                        {config.iconType === "preset" && <>
                            <div style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                borderRadius: "25%",
                                width: `100%`,
                                height: `100%`,
                                background: (color === "#1F2329" && theme === "DARK") ? "#FFF" : color,
                                opacity: 0.1
                            }}>
                            </div>
                            {
                                // @ts-ignore
                                IconsMap[config.presetIconIndex]((color === "#1F2329" && theme === "DARK") ? "#FFF" : color, isConfig ? "11vmin" : "11vmax")
                            }
                        </>}
                    </div>
                </div>
            </div>
          }
            
        </Spin>
    );

}


/* =========================
 * 统一中间结构
 * ========================= */
interface NormalizedCell {
  texts: string[]; // 用于搜索
  links?: { text: string; url: string }[]; // 用于 markdown
}

/* =========================
 * 核心：只写一次的解析函数
 * ========================= */
export function normalizeCellValue(
  value: any,
  fieldType?: FieldType,
  config: IMileStoneConfig = {
    title: "文本转换",
        color: colors[0],
        dateType: 'text',
        iconType: 'preset',
        presetIconIndex: 1,
        customIcon: "",
        dateInfo: {
            tableId: '',
            fieldId: '',
            dateType: 'earliest',
            fieldName: ''
        },
        target: "",
        format: 'YYYY-MM-DD',
        fontSize: 13,
        filterValue: [],
        allFields: [],
  }
): NormalizedCell {
  if (value == null) return { texts: [] };

  console.log('value:', value, 'fieldType:', fieldType, 'config:', config);
  switch (fieldType) {
    /* ===== 文本类 ===== */
    // case FieldType.Text:
    // case FieldType.Lookup:
    case FieldType.Formula:
      if (Array.isArray(value)) {
        return {
          texts: value
            .map(v => v?.text ?? '')
            .filter(Boolean),
        };
      }
      if (typeof value === 'object') {
        return { texts: [value.text ?? ''] };
      }
      return { texts: [String(value)] };

    /* ===== 链接 ===== */
    case FieldType.Url:
      if (Array.isArray(value)) {
        return {
          texts: value.map(v => v?.text ?? ''),
          links: value
            .filter(v => v?.link)
            .map(v => ({
              text: v.text ?? '',
              url: v.link,
            })),
        };
      }
      return { texts: [value?.text ?? String(value)] };

    /* ===== 单选 ===== */
    case FieldType.SingleSelect:
      return { texts: [value?.text ?? ''] };

    /* ===== 多选 ===== */
    case FieldType.MultiSelect:
      return {
        texts: Array.isArray(value)
          ? value.map(v => v?.text ?? '')
          : [],
      };

    /* ===== 人员 ===== */
    // case FieldType.User:
    // case FieldType.CreatedUser:
    case FieldType.ModifiedUser:
      return {
        texts: Array.isArray(value)
          ? value.map(v => v?.name ?? v?.text ?? '')
          : [value?.name ?? value?.text ?? ''],
      };

    /* ===== 附件 ===== */
    case FieldType.Attachment:
      return {
        texts: Array.isArray(value)
          ? value.map(v => v?.name ?? '')
          : [],
      };

    /* ===== 数字 / 时间 ===== */
    // case FieldType.Number:
    // case FieldType.Currency:
    // case FieldType.Rating:
    // case FieldType.Progress:
    // case FieldType.AutoNumber:
    case FieldType.DateTime:
      console.log('value:', value, 'config:', config, 'aaaaaaaaaaaaaaaaaaaaa', dayjs(value).format(config.format));
      
      return { texts: [value ? dayjs(value).format(config.format) : ''] };
    case FieldType.CreatedTime:
      return { texts: [value ? dayjs(value).format(config.format) : ''] };
    case FieldType.ModifiedTime:
      return { texts: [String(value)] };

    /* ===== 复选框 ===== */
    case FieldType.Checkbox:
      return { texts: [value ? 'true' : 'false'] };

    /* ===== 兜底（关键修复点） ===== */
    default:
      if (Array.isArray(value)) {
        return {
          texts: value
            .map(v => v?.text ?? v?.name ?? v?.value ?? '')
            .filter(Boolean),
        };
      }

      if (typeof value === 'object') {
        return {
          texts: [
            value.text ??
             value?.value ??
              value.name ??
              '',
          ].filter(Boolean),
        };
      }

      return { texts: [String(value)] };
  }
}


/* =========================
 * 搜索用：转为纯文本（忽略大小写）
 * ========================= */
export function cellValueToSearchText(
  value: any,
  fieldType?: FieldType,
  config?: IMileStoneConfig
): string {
  
  return normalizeCellValue(value, fieldType, config)
    .texts.join(' ')
    .toLowerCase();
}

/* =========================
 * 记录级过滤（按 fieldId）
 * filterValue: [{ fieldId, operator, value }]
 * ========================= */
function filterRecordsByFieldValue(
  records: any[],
  filterValue: FilterValue[],
  fieldTypeMap: Record<string, FieldType>,
  config?: IMileStoneConfig
) {
  console.log(records, 'records', filterValue, fieldTypeMap, config);

  return records.filter(record =>
    filterValue.every(({ fieldId, operator, value }) => {
      console.log('fieldId:', fieldId, 'operator:', operator, 'value:', value, 'record:', record);
      const rawValue = record.fields[fieldId];

      // 为空 / 不为空的特殊处理
      if (rawValue == null) {
        return operator === 'empty';
      }

      const text = cellValueToSearchText(
        rawValue,
        fieldTypeMap[fieldId],
        config
      );

      console.log('searchText:', text);

      return matchByOperator(text, operator, [FieldType.ModifiedTime, FieldType.CreatedTime, FieldType.DateTime].includes(fieldTypeMap[fieldId]) ? filterTodayOrYesterday(value, config) : value);
    })
  );
}

function filterTodayOrYesterday(
  type: string,
  config: Partial<IMileStoneConfig> = {}
) {
  console.log('jintian=============', dayjs().format(config.format));
  
  if(type === 'today') return dayjs().format(config.format);
  if(type === 'yesterday') return dayjs().subtract(1, 'day').format(config.format);
  return type
}

function matchByOperator(
  text: string,
  operator: FilterOperator,
  compareValue?: string
): boolean {
  const left = text.trim().toLowerCase();
  const right = compareValue?.trim().toLowerCase() ?? '';

  switch (operator) {
    case 'eq':
      return left === right;

    case 'neq':
      return left !== right;

    case 'contains':
      return left.includes(right);

    case 'not_contains':
      return !left.includes(right);

    case 'empty':
      return left === '';

    case 'not_empty':
      return left !== '';

    default:
      return true;
  }
}


