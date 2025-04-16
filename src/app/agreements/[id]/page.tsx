import React from "react";
import Link from "next/link";

// 静态参数
export function generateStaticParams() {
  return [{ id: "placeholder-id" }];
}

// 为客户端提供返回的静态HTML
export default function AgreementDetail({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="text-center p-12 bg-base-200 rounded-lg max-w-4xl mx-auto">
      <h3 className="text-xl mb-4">协议查看</h3>
      <p className="mb-6">请注意：完整功能需要JavaScript支持</p>
      <p className="mb-6">协议ID: {params.id}</p>
      <Link href="/agreements" className="btn btn-primary">
        返回协议列表
      </Link>
    </div>
  );
}
