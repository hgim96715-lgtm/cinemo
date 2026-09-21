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
  const brandColors = ['#75c2aa', '#f49363', '#91a2d2', '#d987bd'];
  const brandData = analysis.brands.map((brand) => ({
    id: brand.name,
    label: brand.name,
    value: brand.count,
  }));

  return (
    <div className="cinema-analysis-charts">
      <section className="cinema-analysis-chart-card">
        <h3>지역별 영화관 수</h3>

        <div className="cinema-analysis-chart cinema-analysis-chart--regions">
          <ResponsiveBar
            data={[...analysis.regions].reverse()}
            keys={['count']}
            indexBy="name"
            layout="horizontal"
            margin={{ top: 20, right: 20, bottom: 40, left: 135 }}
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
              tickSize: 0,
              tickPadding: 8,
              tickValues: 5,
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
            colors={brandColors}
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
            arcLabel={(datum) => `${datum.value}개`}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="#17181c"
          />
        </div>

        <ul className="cinema-analysis-brand-list">
          {brandData.map((brand, index) => (
            <li key={brand.id}>
              <span
                className="cinema-analysis-tooltip-dot"
                style={{ backgroundColor: brandColors[index % brandColors.length] }}
              />
              <span>{brand.label}</span>
              <strong>{brand.value}개</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
