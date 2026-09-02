"use client";

import { Article, FolderSimple, Tag } from "@phosphor-icons/react";
import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { ArticlesTable } from "./articles-table";
import { PostCategoriesTab } from "./post-categories-tab";
import { PostTagsTab } from "./post-tags-tab";

export function ArticlesManagementPage() {
  const [activeTab, setActiveTab] = React.useState("articles");

  return (
    <div className="flex flex-col gap-6">
      {/* Context Subtitle */}
      <div className="-mt-1">
        <p className="text-sm text-slate-500">
          Quản lý xuất bản bài viết chuyên môn, chuẩn hóa danh mục nội dung và hệ thống thẻ gắn kèm
          chuẩn SEO.
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-[500px]">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <Article size={16} weight="bold" />
            Bài viết
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderSimple size={16} weight="bold" />
            Danh mục
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag size={16} weight="bold" />
            Thẻ (Tags)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6 outline-none">
          <ArticlesTable />
        </TabsContent>

        <TabsContent value="categories" className="mt-6 outline-none">
          <PostCategoriesTab />
        </TabsContent>

        <TabsContent value="tags" className="mt-6 outline-none">
          <PostTagsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
