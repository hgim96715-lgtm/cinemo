import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import type { CinemaAnalysisResponse } from '@cinemo/api-contract';

type Props = {
  analysis: CinemaAnalysisResponse;
};

const chartTheme = {
  axis: {
    ticks: {
      text: {
        fill: '#f4f1e8',
        fontSize: 12,
        fontWeight: 600,
      },
    },
    legend: {
      text: {
        fill: '#f4f1e8',
        fontSize: 12,
      },
    },
  },
  grid: {
    line: {
      stroke: 'rgb(212 181 106 / 28%)',
      strokeWidth: 1,
    },
  },
};

export function CinemaAnalysisCharts({ analysis }: Props) {
  const brandData = analysis.brands.map((brand) => ({
    id: brand.name,
    label: brand.name,
    value: brand.count,
  }));

  return (
    <div className="cinema-analysis-charts">
      <section className="cinema-analysis-chart-card">
        <h3>지역별 영화관 수</h3>

        <div className="cinema-analysis-chart">
          <ResponsiveBar
            data={analysis.regions}
            keys={['count']}
            indexBy="name"
            margin={{ top: 20, right: 20, bottom: 110, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['#d4b56a']}
            borderRadius={4}
            enableLabel={false}
            theme={chartTheme}
            tooltip={({ id, value, indexValue, color }) => (
              <div className="cinema-analysis-tooltip">
                <span
                  className="cinema-analysis-tooltip-dot"
                  style={{ backgroundColor: color }}
                />
                <strong>{indexValue}</strong>
                <span>{value}개</span>
              </div>
            )}
            axisBottom={{
              tickRotation: -35,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
            }}
          />
        </div>
      </section>

      <section className="cinema-analysis-chart-card">
        <h3>브랜드별 영화관 수</h3>

        <div className="cinema-analysis-chart">
          <ResponsivePie
            data={brandData}
            margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
            innerRadius={0.55}
            padAngle={1}
            cornerRadius={4}
            activeOuterRadiusOffset={6}
            colors={{ scheme: 'set2' }}
            theme={chartTheme}
            tooltip={({ datum }) => (
              <div className="cinema-analysis-tooltip">
                <span
                  className="cinema-analysis-tooltip-dot"
                  style={{ backgroundColor: datum.color }}
                />
                <strong>{datum.label}</strong>
                <span>{datum.value}개</span>
              </div>
            )}
            enableArcLinkLabels={false}
            arcLabel={(datum) => `${datum.label} ${datum.value}개`}
            arcLabelsSkipAngle={0}
            arcLabelsTextColor="#17181c"
          />
        </div>
      </section>
    </div>
  );
}
