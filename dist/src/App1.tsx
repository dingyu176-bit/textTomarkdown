import React, { useEffect, useRef, useState } from 'react';
import {
    bitable,
    dashboard,
    DashboardState,
    DATA_SOURCE_SORT_TYPE,
    IData,
    IDataCondition,
    ORDER,
    Rollup,
    workspace,
    bridge,
    IDashboard,
} from "@lark-base-open/js-sdk";
import { Button, ConfigProvider, DatePicker, Divider, Icon, Input, Select, Spin, Tooltip } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import "./i18n/index"
import { useTranslation } from "react-i18next";

import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import enUS from '@douyinfe/semi-ui/lib/es/locale/source/en_US';

import classnames from 'classnames'
import classNames from 'classnames'
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import SettingIcon from "./SettingIcon";
import { IconsMap } from "./iconMap";
import BaseSelector from './components/BaseSelector';

interface IMileStoneConfig {
    title: string;
    dateType: 'date' | 'ref';
    iconType: "preset" | "custom"; // 自定义 预设
    presetIconIndex: number,
    customIcon: string;
    dateInfo: {
        tableId: string;
        fieldId: string;
        dateType: 'earliest' | 'latest';
        baseToken?: string;
    };
    target: number;
    format: string;
    color: string;
}

const formatOptions = ['YYYY/MM/DD', 'YYYY-MM-DD', 'MM-DD', 'MM/DD/YY', 'DD/MM/YY']

const colors = ["#1F2329", "#1456F0", "#7A35F0", "#35BD4B", "#2DBEAB", "#FFC60A", "#FF811A", "#F54A45"]


dayjs.locale('zh-cn');

function CheckIcon({ color }: { color: string }) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
            d="M6 1C3.23858 1 1 3.23858 1 6V18C1 20.7614 3.23858 23 6 23H18C20.7614 23 23 20.7614 23 18V6C23 3.23858 20.7614 1 18 1H6Z"
            stroke={color} stroke-width="2" />
        <path
            d="M3 7C3 4.79086 4.79086 3 7 3H17C19.2091 3 21 4.79086 21 7V17C21 19.2091 19.2091 21 17 21H7C4.79086 21 3 19.2091 3 17V7Z"
            fill={color} />
        <path
            d="M10.145 15.6067L17.221 8.5308C17.4785 8.27328 17.8963 8.27503 18.1538 8.53257C18.4145 8.79326 18.4119 9.218 18.1468 9.4741C15.8213 11.7202 15.3281 12.1957 10.7628 16.6346C10.3818 17.005 9.7738 17.0164 9.38695 16.6522C8.19119 15.5262 7.06993 14.4154 5.90217 13.2492C5.64195 12.9893 5.64287 12.5674 5.90292 12.3074C6.16298 12.0473 6.58477 12.0464 6.84482 12.3064L10.145 15.6067Z"
            fill={color === "#FFF" ? '#000' : 'white'} />
    </svg>
}

export function SelectRefDate({
  config,
  setConfig,
  isMultipleBase,
}: {
  config: IMileStoneConfig;
  setConfig: any;
  isMultipleBase: boolean | undefined;
}) {
  const [tables, setTables] = React.useState<any[]>([]);
  const [fields, setFields] = React.useState<any[]>([]);
  const [tableLoading, setTableLoading] = React.useState<boolean>(false);
  const { t } = useTranslation()
  const baseHasChanged = useRef(false);

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
    if (baseHasChanged.current || (!config?.dateInfo?.tableId || !config?.dateInfo?.fieldId)) {
      if (tables && tables.length > 0) {
        let targetTableId = tables[0].id
        let fields: any = []
        let targetFieldId = ""
        for (let table_info of tables) {
          // console.log("表格",table_info)
          let table = await realBitable?.base?.getTableById(table_info.id);
          let allFields = (await table?.getFieldMetaList()) || [];
          let dateFields = allFields.filter((item) => item.type === 5 || item.type === 1001 || item.type === 1002)
          if (dateFields && dateFields.length > 0) {
            fields = dateFields
            targetTableId = table_info.id
            targetFieldId = dateFields[0].id
            break
          }
        }
        if (fields.length > 0) {
          setFields(fields)
          setConfig({
            ...config,
            dateInfo: {
              ...config.dateInfo,
              tableId: targetTableId,
              fieldId: targetFieldId,
              dateType: 'earliest'
            }
          })
        }
      }
    }

    if (config.dateType === 'ref' && config.dateInfo.tableId) {
            console.log("you have table id")
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
          dateType: "earliest",
        },
      }));
    }
    getTables();
  }, [config?.dateInfo?.baseToken, isMultipleBase]);

  async function getDateFields(table_id: string) {
    console.log("获取", table_id);
    if (isMultipleBase && !config?.dateInfo?.baseToken) {
      return;
    }
    const realBitable = isMultipleBase
      ? await workspace.getBitable(config.dateInfo.baseToken!)
      : bitable;
    let table = await realBitable?.base?.getTableById(table_id);
    let allFields = (await table?.getFieldMetaList()) || [];
    let fields = allFields.filter(
      (item) => item.type === 5 || item.type === 1001 || item.type === 1002
    );
    setFields(fields);
    setConfig({
      ...config,
      dateInfo: {
        ...config.dateInfo,
        tableId: table_id,
      },
    });
    return fields;
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
                    let fields = await getDateFields(v as string);
                    setConfig({
                        ...config,
                        dateInfo: {
                            ...config.dateInfo,
                            tableId: v,
                            fieldId: fields?.[0] ? fields[0].id : "",
                            dateType: 'earliest'
                        }
                    })
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
                {t('日期字段')}
            </div>
            <Select
                style={{
                    width: "100%"
                }}
                onChange={v => {
                    setConfig({
                        ...config,
                        dateInfo: {
                            ...config.dateInfo,
                            fieldId: v
                        }
                    })
                }}
                value={fields.find(item => item.id === config.dateInfo.fieldId) ? config.dateInfo.fieldId : ""}
                placeholder={t('请选择日期字段')}
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
            <div className={"tab-wrap"}>
                <div
                    onClick={() => {
                        setConfig({
                            ...config,
                            dateInfo: {
                                ...config.dateInfo,
                                dateType: 'earliest'
                            }
                        })
                    }}
                    className={classnames({
                        "tab-item": true,
                        "active": (!config.dateInfo || config.dateInfo.dateType === 'earliest')
                    })}>
                    {t('最小日期')}
                </div>
                <div
                    onClick={() => {
                        setConfig({
                            ...config,
                            dateInfo: {
                                ...config.dateInfo,
                                dateType: 'latest'
                            }
                        })
                    }}
                    className={classnames({
                        "tab-item": true,
                        "active": (config.dateInfo && config.dateInfo.dateType === 'latest')
                    })}>
                    {t('最大日期')}
                </div>
            </div>
        </div>

    </div>)

}

export default function App() {
  const [locale, setLocale] = useState(zhCN);
  const { t } = useTranslation()
 const [config, setConfig] = useState<IMileStoneConfig>({
        title: t("项目启动日期"),
        color: colors[0],
        dateType: 'date',
        iconType: 'preset',
        presetIconIndex: 1,
        customIcon: "",
        dateInfo: {
            tableId: '',
            fieldId: '',
            dateType: 'earliest'
        },
        target: 0,
        format: 'YYYY-MM-DD',
    })
  const [theme, setTheme] = useState('LIGHT')
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

    const changeDateType = (type: 'date' | 'ref') => {
        let dateInfo: any = {}
        if (type === 'date') {
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
      console.log('====onConfigChange', r)
      // 监听配置变化，协同修改配置
      updateConfig(r.data);
    });
    return () => {
      offConfigChange();
    }
  }, []);

  const onClick = () => {
    // 保存配置
    console.log("保存配置", config)
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
                    <MileStone key={update} config={config} isConfig={isConfig} />
                </div>
                {
                    isConfig && (
                        <div className='config-panel'>
                            <div className='form'>
                                <div className='form-item'>
                                    <div className='label'>{t("日期标题")}</div>
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
                                    <div className={'label'}>{t('日期')}</div>
                                    <div className={'common-wrap'}>
                                        <div style={{
                                            color: 'var(--small-title-text-color)',
                                            fontSize: 12,
                                        }}>
                                            {t('选择日期')}
                                        </div>
                                        <div className={'tab-wrap'}>
                                            <div
                                                onClick={() => changeDateType('date')}
                                                className={classNames({
                                                    'active': config.dateType === 'date',
                                                    'tab-item': true,
                                                })}>
                                                {t('指定日期')}
                                            </div>
                                            <div
                                                onClick={() => changeDateType('ref')}
                                                className={classNames({
                                                    'active': config.dateType === 'ref',
                                                    'tab-item': true,
                                                })}>
                                                {t('选择日期')}
                                            </div>
                                        </div>
                                        {
                                            config.dateType === 'date' && (
                                                <div>
                                                    <DatePicker
                                                        showClear={false}
                                                        format={"yyyy/MM/dd"}
                                                        style={{ width: '100%', marginTop: 8 }}
                                                        value={new Date(config.target)}
                                                        onChange={(date) => {
                                                            setConfig({
                                                                ...config,
                                                                target: new Date(date as string).getTime(),
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            )
                                        }

                                        {
                                            config.dateType === 'ref' && (
                                                <SelectRefDate config={config} setConfig={setConfig} isMultipleBase={isMultipleBase} />
                                            )
                                        }
                                    </div>
                                </div>

                                <div className={'form-item'}>
                                    <div className={'common-wrap'}>
                                        <div style={{
                                            color: 'var(--small-title-text-color)',
                                            fontSize: 12,
                                        }}>
                                            {t('日期格式')}
                                        </div>
                                        <Select
                                            style={{
                                                marginTop: 8,
                                                width: '100%',
                                            }}
                                            value={config.format}
                                            onChange={(v) => {
                                                if (!v) return
                                                setConfig({
                                                    ...config,
                                                    format: v as string,
                                                })
                                            }}
                                            optionList={formatOptions.map((v) => ({
                                                label: dayjs(config.target).format(v),
                                                value: v,
                                            }))}></Select>
                                    </div>
                                </div>
                                <Divider margin={10} />

                                <SettingIcon theme={theme} config={config} setConfig={setConfig} />

                                {
                                    config.iconType === 'preset' && (<div className='form-item'>
                                        <div style={{
                                            color: 'var(--small-title-text-color)',
                                            fontSize: 12,
                                        }}>
                                            {t('图标颜色')}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            marginTop: 8
                                        }}>
                                            {
                                                colors.map(item => {
                                                    if (config.color === item) {
                                                        return <div style={{
                                                            marginRight: 7,
                                                        }}>
                                                            <CheckIcon
                                                                color={(item === "#1F2329" && theme === 'DARK') ? "#FFF" : item} />
                                                        </div>
                                                    }
                                                    return <div
                                                        onClick={() => {
                                                            setConfig({
                                                                ...config,
                                                                color: item,
                                                            })
                                                        }}
                                                        style={{
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: 4,
                                                            background: (item === "#1F2329" && theme === 'DARK') ? "#FFF" : item,
                                                            padding: 2,
                                                            textAlign: 'center',
                                                            marginRight: 7,
                                                        }}>
                                                    </div>
                                                })
                                            }

                                        </div>
                                    </div>)
                                }

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


function MileStone({ config, isConfig }: {
    config: IMileStoneConfig,
    isConfig: boolean;
}) {

    const { title, format, color, target } = config
    const [time, setTime] = useState("")
    const [diffDay, setDiffDay] = useState(0)
    const { t } = useTranslation()
    const [theme, setTheme] = useState('LIGHT')

  const dashboardRef = useRef<IDashboard>(dashboard);

  useEffect(() => {
    (async () => {
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
            console.log("bgColor", bgColor)
            // @ts-ignore
            body.style.setProperty('--bg-color', bgColor);
        }

        dashboardRef.current.getTheme().then((theme) => {
            console.log("them 变化111", theme, theme.theme)
            // @ts-ignore
            changeTheme({ theme: theme.theme, bgColor: theme.chartBgColor });
        })
        dashboardRef.current.onThemeChange(res => {
            console.log("them 变化", res)
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
      console.log("====getTime", {
        config: JSON.parse(JSON.stringify(config))
    })
      let data: IData = [];
      let tableId = config.dateInfo.tableId
      let fieldId = config.dateInfo.fieldId
      let dateType = config.dateInfo.dateType;

      if (isConfig) {
        data = await dashboardRef.current.getPreviewData({
          tableId: tableId,
          groups: [
            {
              fieldId: fieldId,
            }
          ],
        });
        console.log("====getTime - 预览数据", data);
      } else {
        data = await dashboardRef.current.getData()
        console.log('====getTime - 非预览模式getData', data)
      }
      const { maxTimeFormat, minTimeFormat, maxDate, minDate } = getMaxMinTimeFromData(data)

      let time = ''

      if (dateType === 'earliest') {
        time = minTimeFormat
      } else {
        time = maxTimeFormat
      }
      console.log("====getTime 重新设置数据的时间", time)
      setTime(dayjs(time).format(format))
      await dashboardRef.current.setRendered()
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
      console.log("====onDataChange触发", r);// TODO 由saveConfig触发的此回调。这个时机触发的n（n可能有几十秒），onDataChange拿到的数据，以及调用getData拿到的数据还是旧的
      setTimeout(() => {
        loadTimeInfo('===onDataChange 延迟1s触发');
      }, 1000);
      // if (config.dateType === "ref") {
      //     let info = r.data
      //     const { maxTimeFormat, minTimeFormat, maxDate, minDate } = getMaxMinTimeFromData(info)
      //     const time = config.dateInfo.dateType === 'earliest' ? minTimeFormat : maxTimeFormat
      //     console.log("data change,时间", time)
      //     setTime(dayjs(time).format(format))
      // }
    })
    return () => {
      off()
    }
  }, [config, isConfig])


   return (
        <Spin spinning={!time}>
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
                    <Tooltip trigger={'hover'} position={'bottom'}
                        content={diffDay > 0 ? t(`距离目标日期{{count}}天`, { count: diffDay }) : t(`已超过设定日期`)}>
                        <div style={{
                            marginLeft: `${isConfig ? "2vmin" : "2vmax"}`,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }}>
                            <div style={{
                                fontSize: `${isConfig ? "8.4vmin" : "8.4vmax"}`,
                                color: "var(--title-color)",
                                fontWeight: 600,
                                alignSelf: "flex-start",
                                marginBottom: `${isConfig ? "1vmin" : "1vmax"}`
                            }}>
                                {time}
                            </div>
                            <div style={{
                                fontSize: `${isConfig ? "3vmin" : "3vmax"}`,
                                color: "var(--sub-title-color)",
                                marginBottom: `${isConfig ? "2vmin" : "1vmax"}`,
                                textAlign: "left",
                                fontWeight: 400,
                                // 不换号，超过省略号
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: `${isConfig ? "50vmin" : "50vmax"}`
                            }}>
                                {title}
                            </div>
                        </div>
                    </Tooltip>

                </div>
            </div>
        </Spin>
    );

}
