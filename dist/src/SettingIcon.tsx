import classNames from "classnames";
import React from "react";
import './App.css';
import {useTranslation} from "react-i18next";
import {Button, Icon, Upload} from "@douyinfe/semi-ui";
import {IconsMap} from "./iconMap";


// @ts-ignore
export default function ({config, setConfig, theme}) {
    const {t} = useTranslation()

    function changeIconType(value: string) {
        setConfig((pre: any) => {
            return {
                ...pre,
                iconType: value
            }
        })
    }


    return <div className={'form-item'}>
        {/* <div className={'label'}>{t("图标")}</div>
        <div className={'common-wrap'}>
            <div className={'tab-wrap'}>
                <div
                    onClick={() => changeIconType('preset')}
                    className={classNames({
                        'active': config.iconType === 'preset',
                        'tab-item': true,
                    })}>
                    {t('预设图标')}
                </div>
                <div
                    onClick={() => changeIconType('custom')}
                    className={classNames({
                        'active': config.iconType === 'custom',
                        'tab-item': true,
                    })}>
                    {t('自定义图标')}
                </div>
            </div>
            {config.iconType === 'preset' && <Preset theme={theme} config={config} setConfig={setConfig}/>}
            {config.iconType === 'custom' && <Custom config={config} setConfig={setConfig}/>}
        </div> */}
    </div>
}

// @ts-ignore
function Custom({config, setConfig}) {
    const {t} = useTranslation()

    // @ts-ignore
    function upload({ file, onProgress, onError, onSuccess }) {
        console.log("file", file)
        // 获取文件内容
        const reader = new FileReader();
        reader.readAsText(file.fileInstance);
        reader.onload = function (e) {
            const content = reader.result;
            console.log("content", content)
            setConfig((pre: any) => {
                return {
                    ...pre,
                    iconType: 'custom',
                    customIcon: content
                }
            })
        };

        onSuccess()


    }

    return <div>
        <Upload
            customRequest={upload}
            limit={1}
            style={
                // @ts-ignore
                {"--semi-color-tertiary-light-default": "transparent", border: "none"}
            }
            border={null}
            draggable={true}
            dragMainText={<div style={{padding: "30px 0", background: "transparent"}}>{t("拖拽svg到这里上传，或者")}<span
                style={{color: "var(--active-color)", marginLeft: 2}}>{t("选择文件")}</span></div>}
            dragIcon={<></>}
            accept={".svg"}>


        </Upload>


    </div>

}

// @ts-ignore

function Preset({config, setConfig, theme}) {
    return <div className={'iconWrap'}>
        {
            // @ts-ignore
            (new Array(24).fill()).map((item, index) => {
                // @ts-ignore
                return IconsMap[index + 1] && <div
                    onClick={() => {
                        // @ts-ignore
                        setConfig((pre) => {
                            return {
                                ...pre,
                                presetIconIndex: index + 1
                            }
                        })
                    }}
                    className={`icon ${config.presetIconIndex == index + 1 ? 'active' : ""}`}
                >
                    {
                        // @ts-ignore
                        IconsMap[index + 1](theme === "DARK" ? "#fff":"#000")
                    }
                </div>
            })
        }
    </div>
}
