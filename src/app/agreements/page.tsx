"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";

// 协议类型定义
interface Agreement {
  id: string;
  agreementTitle: string;
  date: string;
  party1Name: string;
  party2Name: string;
  createdAt: string;
  party1ID: string;
  party2ID: string;
  consentDetails: string;
  safetyMeasures: string[];
  privacyTerms: string;
  revocationTerms: string;
  additionalTerms?: string;
  party1Signed?: boolean;
  party2Signed?: boolean;
  party1SignedAt?: string;
  party2SignedAt?: string;
}

// 本地存储键
const STORAGE_KEY = "consent-agreements";

export default function AgreementsList() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(
    null
  );
  const [party1Signed, setParty1Signed] = useState<boolean>(false);
  const [party2Signed, setParty2Signed] = useState<boolean>(false);
  const [showDigitalSignature, setShowDigitalSignature] = useState<
    false | "party1" | "party2"
  >(false);

  // 处理打印功能
  const handlePrint = () => {
    if (!selectedAgreement) return;

    try {
      // 创建打印样式
      const style = document.createElement("style");
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .btn, button, .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `;
      document.head.appendChild(style);

      // 添加打印内容容器
      const printContainer = document.createElement("div");
      printContainer.className = "print-content";
      printContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">${
            selectedAgreement.agreementTitle
          }</h1>
        </div>
        <div style="margin-bottom: 20px;">
          <div style="margin-bottom: 10px;">
            <p>日期: ${selectedAgreement.date}</p>
            <p>参与方1: ${selectedAgreement.party1Name}</p>
            <p>身份证号: ${selectedAgreement.party1ID}</p>
            <p>参与方2: ${selectedAgreement.party2Name}</p>
            <p>身份证号: ${selectedAgreement.party2ID}</p>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 18px; margin-bottom: 10px;">同意详情</h3>
          <p style="white-space: pre-line;">${
            selectedAgreement.consentDetails
          }</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 18px; margin-bottom: 10px;">安全措施</h3>
          <ul>
            ${selectedAgreement.safetyMeasures
              .map((measure) => `<li>${measure}</li>`)
              .join("")}
          </ul>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 18px; margin-bottom: 10px;">隐私条款</h3>
          <p style="white-space: pre-line;">${
            selectedAgreement.privacyTerms
          }</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 18px; margin-bottom: 10px;">撤回同意条款</h3>
          <p style="white-space: pre-line;">${
            selectedAgreement.revocationTerms
          }</p>
        </div>
        ${
          selectedAgreement.additionalTerms
            ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; margin-bottom: 10px;">额外条款</h3>
              <p style="white-space: pre-line;">${selectedAgreement.additionalTerms}</p>
            </div>
          `
            : ""
        }
        ${
          party1Signed || party2Signed
            ? `
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
              <h3 style="text-align: center; margin-bottom: 15px;">签名</h3>
              ${
                party1Signed && selectedAgreement.party1SignedAt
                  ? `
                  <p>${selectedAgreement.party1Name} 已签署</p>
                  <p>签署时间: ${new Date(
                    selectedAgreement.party1SignedAt
                  ).toLocaleString("zh-CN")}</p>
                `
                  : ""
              }
              ${
                party2Signed && selectedAgreement.party2SignedAt
                  ? `
                  <p>${selectedAgreement.party2Name} 已签署</p>
                  <p>签署时间: ${new Date(
                    selectedAgreement.party2SignedAt
                  ).toLocaleString("zh-CN")}</p>
                `
                  : ""
              }
            </div>
          `
            : ""
        }
      `;

      document.body.appendChild(printContainer);

      // 调用打印
      window.print();

      // 清理
      setTimeout(() => {
        document.body.removeChild(printContainer);
        document.head.removeChild(style);
      }, 1000);
    } catch (error) {
      console.error("打印错误:", error);
      alert("打印文档时发生错误，请稍后再试。");
    }
  };

  // 修改导出功能
  const handleExportPDF = () => {
    if (!selectedAgreement) return;

    try {
      // 显示加载状态
      const loadingEl = document.createElement("div");
      loadingEl.style.position = "fixed";
      loadingEl.style.top = "0";
      loadingEl.style.left = "0";
      loadingEl.style.width = "100%";
      loadingEl.style.height = "100%";
      loadingEl.style.backgroundColor = "rgba(0,0,0,0.5)";
      loadingEl.style.display = "flex";
      loadingEl.style.alignItems = "center";
      loadingEl.style.justifyContent = "center";
      loadingEl.style.zIndex = "9999";

      const loadingBox = document.createElement("div");
      loadingBox.style.backgroundColor = "white";
      loadingBox.style.padding = "2rem";
      loadingBox.style.borderRadius = "0.5rem";
      loadingBox.style.textAlign = "center";
      loadingBox.innerHTML = "正在生成文档...";

      loadingEl.appendChild(loadingBox);
      document.body.appendChild(loadingEl);

      // 使用setTimeout来允许加载状态显示
      setTimeout(() => {
        try {
          // 创建临时容器用于生成图像
          const container = document.createElement("div");
          container.style.position = "absolute";
          container.style.left = "-9999px";
          container.style.top = "0";
          container.style.width = "800px"; // 设置宽度以确保布局正确
          container.style.fontFamily = "Arial, 'Microsoft YaHei', sans-serif"; // 确保使用支持中文的字体
          container.style.backgroundColor = "#ffffff"; // 确保背景为白色

          // 使用明确的RGB颜色值
          const textColor = "rgb(0, 0, 0)";
          const bgColor = "rgb(249, 249, 249)";
          const borderColor = "rgb(238, 238, 238)";

          // 添加内容到临时容器
          container.innerHTML = `
            <div style="padding: 20px; font-family: Arial, 'Microsoft YaHei', sans-serif;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 24px; font-weight: bold; color: ${textColor};">${
            selectedAgreement.agreementTitle
          } - ${selectedAgreement.date}</h1>
              </div>
              
              <div style="margin-bottom: 30px; color: ${textColor};">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px; width: 25%; color: rgb(85, 85, 85);">日期:</td>
                    <td style="padding: 8px; font-weight: 500;">${
                      selectedAgreement.date
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; width: 25%; color: rgb(85, 85, 85);">参与方1:</td>
                    <td style="padding: 8px; font-weight: 500;">${
                      selectedAgreement.party1Name
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; width: 25%; color: rgb(85, 85, 85);">身份证号:</td>
                    <td style="padding: 8px;">${selectedAgreement.party1ID}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; width: 25%; color: rgb(85, 85, 85);">参与方2:</td>
                    <td style="padding: 8px; font-weight: 500;">${
                      selectedAgreement.party2Name
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; width: 25%; color: rgb(85, 85, 85);">身份证号:</td>
                    <td style="padding: 8px;">${selectedAgreement.party2ID}</td>
                  </tr>
                </table>
              </div>
              
              <div style="margin-top: 40px;">
                <h2 style="font-size: 18px; font-weight: bold; color: ${textColor}; padding-bottom: 10px; border-bottom: 1px solid ${borderColor}; margin-bottom: 15px;">同意详情</h2>
                <div style="background-color: ${bgColor}; padding: 15px; border-radius: 5px; color: ${textColor}; white-space: pre-line; margin-bottom: 30px;">${
            selectedAgreement.consentDetails
          }</div>
              </div>
              
              <div style="margin-top: 30px;">
                <h2 style="font-size: 18px; font-weight: bold; color: ${textColor}; padding-bottom: 10px; border-bottom: 1px solid ${borderColor}; margin-bottom: 15px;">安全措施</h2>
                <ul style="background-color: ${bgColor}; padding: 15px 15px 15px 35px; border-radius: 5px; margin-bottom: 30px;">
                  ${selectedAgreement.safetyMeasures
                    .map(
                      (measure) =>
                        `<li style="margin: 8px 0; color: ${textColor};">${measure}</li>`
                    )
                    .join("")}
                </ul>
              </div>
              
              <div style="margin-top: 30px;">
                <h2 style="font-size: 18px; font-weight: bold; color: ${textColor}; padding-bottom: 10px; border-bottom: 1px solid ${borderColor}; margin-bottom: 15px;">隐私条款</h2>
                <div style="background-color: ${bgColor}; padding: 15px; border-radius: 5px; color: ${textColor}; white-space: pre-line; margin-bottom: 30px;">${
            selectedAgreement.privacyTerms
          }</div>
              </div>
              
              <div style="margin-top: 30px;">
                <h2 style="font-size: 18px; font-weight: bold; color: ${textColor}; padding-bottom: 10px; border-bottom: 1px solid ${borderColor}; margin-bottom: 15px;">撤回同意条款</h2>
                <div style="background-color: ${bgColor}; padding: 15px; border-radius: 5px; color: ${textColor}; white-space: pre-line; margin-bottom: 30px;">${
            selectedAgreement.revocationTerms
          }</div>
              </div>
              
              ${
                selectedAgreement.additionalTerms
                  ? `
                <div style="margin-top: 30px;">
                  <h2 style="font-size: 18px; font-weight: bold; color: ${textColor}; padding-bottom: 10px; border-bottom: 1px solid ${borderColor}; margin-bottom: 15px;">额外条款</h2>
                  <div style="background-color: ${bgColor}; padding: 15px; border-radius: 5px; color: ${textColor}; white-space: pre-line; margin-bottom: 30px;">${selectedAgreement.additionalTerms}</div>
                </div>
              `
                  : ""
              }
              
              ${
                party1Signed || party2Signed
                  ? `
                <div style="margin-top: 50px; page-break-inside: avoid;">
                  <h2 style="font-size: 18px; font-weight: bold; color: ${textColor}; text-align: center; margin-bottom: 20px;">签名</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${
                      party1Signed && selectedAgreement.party1SignedAt
                        ? `
                      <tr>
                        <td style="padding: 10px; border-top: 1px solid ${borderColor}; width: 30%; color: rgb(85, 85, 85);">参与方1:</td>
                        <td style="padding: 10px; border-top: 1px solid ${borderColor}; font-weight: 500;">${
                            selectedAgreement.party1Name
                          } 已签署</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; border-bottom: 1px solid ${borderColor}; color: rgb(85, 85, 85);">签署时间:</td>
                        <td style="padding: 10px; border-bottom: 1px solid ${borderColor};">${new Date(
                            selectedAgreement.party1SignedAt
                          ).toLocaleString("zh-CN")}</td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      party2Signed && selectedAgreement.party2SignedAt
                        ? `
                      <tr>
                        <td style="padding: 10px; border-top: 1px solid ${borderColor}; width: 30%; color: rgb(85, 85, 85);">参与方2:</td>
                        <td style="padding: 10px; border-top: 1px solid ${borderColor}; font-weight: 500;">${
                            selectedAgreement.party2Name
                          } 已签署</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; border-bottom: 1px solid ${borderColor}; color: rgb(85, 85, 85);">签署时间:</td>
                        <td style="padding: 10px; border-bottom: 1px solid ${borderColor};">${new Date(
                            selectedAgreement.party2SignedAt
                          ).toLocaleString("zh-CN")}</td>
                      </tr>
                    `
                        : ""
                    }
                  </table>
                </div>
              `
                  : ""
              }
            </div>
          `;

          document.body.appendChild(container);

          // 使用html2canvas捕获容器内容
          const html2canvasOptions = {
            scale: 2, // 提高清晰度
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            ignoreElements: (element: Element) => {
              // 跳过可能包含不支持颜色格式的元素
              if (typeof element.className === "string") {
                return (
                  element.className.includes("loading") ||
                  element.className.includes("badge")
                );
              }
              return false;
            },
          };

          html2canvas(container, html2canvasOptions)
            .then((canvas) => {
              // 创建下载链接
              const link = document.createElement("a");
              // 使用更高质量设置转换为PNG
              link.href = canvas.toDataURL("image/png", 1.0);
              // 设置文件名
              link.download = `${selectedAgreement.agreementTitle}.png`;
              document.body.appendChild(link);
              // 触发下载
              link.click();

              // 清理DOM
              document.body.removeChild(link);
              document.body.removeChild(container);
              document.body.removeChild(loadingEl);
            })
            .catch((error) => {
              console.error("HTML2Canvas错误:", error);
              document.body.removeChild(container);
              document.body.removeChild(loadingEl);
              alert("导出文档时发生错误，请稍后再试。");
            });
        } catch (error) {
          console.error("导出文档错误:", error);
          document.body.removeChild(loadingEl);
          alert("导出文档时发生错误，请稍后再试。");
        }
      }, 100);
    } catch (error) {
      console.error("导出文档错误:", error);
      alert("导出文档时发生错误，请稍后再试。");
    }
  };

  // 使用原生JavaScript读取URL参数
  useEffect(() => {
    // 直接从window.location.search获取参数
    function getQueryParam(name: string) {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
      }
      return null;
    }

    const fetchData = () => {
      try {
        const storedAgreements = localStorage.getItem(STORAGE_KEY);
        if (storedAgreements) {
          const parsed = JSON.parse(storedAgreements);
          setAgreements(parsed);

          // 检查URL中是否有view参数
          const viewId = getQueryParam("view");
          if (viewId) {
            const foundAgreement = parsed.find((a: any) => a.id === viewId);
            if (foundAgreement) {
              setSelectedAgreement(foundAgreement);
              setParty1Signed(!!foundAgreement.party1Signed);
              setParty2Signed(!!foundAgreement.party2Signed);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching agreements:", error);
      } finally {
        setLoading(false);
      }
    };

    // 只在客户端运行
    if (typeof window !== "undefined") {
      fetchData();
    }
  }, []);

  // 删除协议
  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除此协议吗？删除后无法恢复。")) {
      try {
        const filteredAgreements = agreements.filter(
          (agreement) => agreement.id !== id
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAgreements));
        setAgreements(filteredAgreements);

        // 如果正在查看这个协议，关闭查看
        if (selectedAgreement?.id === id) {
          setSelectedAgreement(null);
          // 更新URL，移除view参数
          window.history.replaceState(null, "", "/agreements");
        }
      } catch (error) {
        console.error("Error deleting agreement:", error);
      }
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  // 处理协议签署
  const handleSign = (party: "party1" | "party2") => {
    if (!selectedAgreement) return;

    try {
      const storedAgreements = localStorage.getItem(STORAGE_KEY);
      if (storedAgreements) {
        const agreements = JSON.parse(storedAgreements);
        const updatedAgreements = agreements.map((a: any) => {
          if (a.id === selectedAgreement.id) {
            if (party === "party1") {
              setParty1Signed(true);
              return {
                ...a,
                party1Signed: true,
                party1SignedAt: new Date().toISOString(),
              };
            } else {
              setParty2Signed(true);
              return {
                ...a,
                party2Signed: true,
                party2SignedAt: new Date().toISOString(),
              };
            }
          }
          return a;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAgreements));

        // 更新本地状态
        const updatedAgreement = updatedAgreements.find(
          (a: any) => a.id === selectedAgreement.id
        );
        if (updatedAgreement) {
          setSelectedAgreement(updatedAgreement);
          setAgreements(updatedAgreements);
        }
      }
    } catch (error) {
      console.error("Error signing agreement:", error);
    }
  };

  // 关闭选中的协议
  const closeSelectedAgreement = () => {
    setSelectedAgreement(null);
    // 更新URL，移除view参数
    window.history.replaceState(null, "", "/agreements");
  };

  // 选择协议查看
  const handleViewAgreement = (id: string) => {
    const foundAgreement = agreements.find((a) => a.id === id);
    if (foundAgreement) {
      setSelectedAgreement(foundAgreement);
      setParty1Signed(!!foundAgreement.party1Signed);
      setParty2Signed(!!foundAgreement.party2Signed);

      // 更新URL，但不导航
      window.history.replaceState(null, "", `/agreements?view=${id}`);
    }
  };

  // 如果正在查看某个协议，显示该协议详情
  if (selectedAgreement) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {selectedAgreement.agreementTitle}
          </h1>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="btn btn-outline">
              打印
            </button>
            <button onClick={handleExportPDF} className="btn btn-outline">
              导出图片
            </button>
            <button
              onClick={closeSelectedAgreement}
              className="btn btn-outline"
            >
              返回列表
            </button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">基本信息</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-base-content/70">日期</p>
                <p>{selectedAgreement.date}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">创建时间</p>
                <p>
                  {new Date(selectedAgreement.createdAt).toLocaleString(
                    "zh-CN"
                  )}
                </p>
              </div>
            </div>

            <div className="divider"></div>

            <h3 className="text-xl font-semibold mb-3">参与方信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-medium">{selectedAgreement.party1Name}</p>
                <p className="text-sm text-base-content/70">
                  身份证号: {selectedAgreement.party1ID}
                </p>
                <div className="mt-3">
                  {party1Signed ? (
                    <div className="badge badge-success gap-2">已签署</div>
                  ) : (
                    <button
                      onClick={() => setShowDigitalSignature("party1")}
                      className="btn btn-sm btn-outline"
                    >
                      点击签署
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-medium">{selectedAgreement.party2Name}</p>
                <p className="text-sm text-base-content/70">
                  身份证号: {selectedAgreement.party2ID}
                </p>
                <div className="mt-3">
                  {party2Signed ? (
                    <div className="badge badge-success gap-2">已签署</div>
                  ) : (
                    <button
                      onClick={() => setShowDigitalSignature("party2")}
                      className="btn btn-sm btn-outline"
                    >
                      点击签署
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">协议内容</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">同意详情</h3>
              <p className="whitespace-pre-line bg-base-200 p-4 rounded-lg">
                {selectedAgreement.consentDetails}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">安全措施</h3>
              <div className="bg-base-200 p-4 rounded-lg">
                <ul className="list-disc list-inside">
                  {selectedAgreement.safetyMeasures.map((measure, index) => (
                    <li key={index}>{measure}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">隐私条款</h3>
              <p className="whitespace-pre-line bg-base-200 p-4 rounded-lg">
                {selectedAgreement.privacyTerms}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">撤回同意条款</h3>
              <p className="whitespace-pre-line bg-base-200 p-4 rounded-lg">
                {selectedAgreement.revocationTerms}
              </p>
            </div>

            {selectedAgreement.additionalTerms && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">额外条款</h3>
                <p className="whitespace-pre-line bg-base-200 p-4 rounded-lg">
                  {selectedAgreement.additionalTerms}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 数字签名弹窗 */}
        {showDigitalSignature !== false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">数字签名确认</h3>

              <p className="mb-6">
                您正在为以下协议进行数字签名:
                <br />
                <span className="font-medium">
                  {selectedAgreement.agreementTitle}
                </span>
              </p>

              <p className="mb-6">
                <strong>签名方:</strong>{" "}
                {showDigitalSignature === "party1"
                  ? selectedAgreement.party1Name
                  : selectedAgreement.party2Name}
              </p>

              <div className="form-control mb-6">
                <label className="flex items-center gap-2 cursor-pointer justify-center">
                  <input type="checkbox" className="checkbox" required />
                  <span>我确认自愿签署此协议，并了解其法律效力</span>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDigitalSignature(false)}
                  className="btn btn-outline"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    handleSign(showDigitalSignature);
                    setShowDigitalSignature(false);
                  }}
                  className="btn btn-primary"
                >
                  确认签署
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">我的协议</h1>
        <Link href="/create" className="btn btn-primary">
          创建新协议
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : agreements.length === 0 ? (
        <div className="text-center p-12 bg-base-200 rounded-lg">
          <h3 className="text-xl mb-4">暂无协议</h3>
          <p className="mb-6">您尚未创建任何性同意协议</p>
          <Link href="/create" className="btn btn-primary">
            立即创建
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>协议标题</th>
                <th>日期</th>
                <th>参与方</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((agreement) => (
                <tr key={agreement.id}>
                  <td className="font-medium">{agreement.agreementTitle}</td>
                  <td>{agreement.date}</td>
                  <td>
                    {agreement.party1Name} 和 {agreement.party2Name}
                  </td>
                  <td>{formatDate(agreement.createdAt)}</td>
                  <td className="flex gap-2">
                    <button
                      onClick={() => handleViewAgreement(agreement.id)}
                      className="btn btn-sm btn-outline"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => handleDelete(agreement.id)}
                      className="btn btn-sm btn-error btn-outline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-outline">
          返回首页
        </Link>
      </div>
    </div>
  );
}
