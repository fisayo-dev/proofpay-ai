"use client";

import { useSyncExternalStore, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { getCachedSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ProductSales = {
  id: string;
  item_name: string;
  total_requests: number;
  paid_count: number;
  total_revenue: number;
  completion_rate: number;
};

const ProductsPage = () => {
  const router = useRouter();
  const session = useSyncExternalStore(
    () => () => {},
    () => getCachedSession(),
    () => null,
  );
  const [products, setProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === null) {
      router.push("/vendors/signup");
    }
  }, [session, router]);

  useEffect(() => {
    if (!session?.vendor_id) return;

    let ignore = false;
    setLoading(true);
    api
      .get<ProductSales[]>(`/vendors/${session.vendor_id}/products/sales`)
      .then((response) => {
        if (!ignore) {
          // Sort by paid_count (sales) in descending order
          const sortedProducts = response.data.sort((a, b) => b.paid_count - a.paid_count);
          setProducts(sortedProducts);
        }
      })
      .catch(() => {
        if (!ignore) setProducts([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [session?.vendor_id]);

  if (!session) return null;

  return (
    <section className="mx-auto space-y-6 pb-20 sm:pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your Products
          </h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            View all your products and see which ones are selling the most.
          </p>
        </div>
        <Button onClick={() => router.push("/vendors/new-product")}>
          + New Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="border border-border/70">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">
              {loading ? "Loading your products..." : "No products yet"}
            </p>
            {!loading && (
              <Button onClick={() => router.push("/vendors/new-product")}>
                Create Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Products List */}
          <Card className="border border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="size-4" />
                </span>
                <div>
                  <CardTitle className="text-xl">Products ranked by sales</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your top performing products first.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between rounded-lg border border-border/70 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="h-fit">
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base leading-tight">
                            {product.item_name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.paid_count} completed sales · {product.completion_rate.toFixed(1)}% completion rate
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ₦{product.total_revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.total_requests} total requests
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>Sales breakdown by product</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="item_name"
                    tick={{ fontSize: 12 }}
                    angle={products.length > 2 ? -45 : 0}
                    textAnchor={products.length > 2 ? "end" : "middle"}
                    height={products.length > 2 ? 80 : 40}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [value, "Sales"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="paid_count"
                    fill="var(--color-paid)"
                    name="Completed Sales"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
};

export default ProductsPage;
