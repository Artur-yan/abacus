import styled, { css } from 'styled-components';

export const DetailCreatedAt = styled.span`
  font-family: Matter, sans-serif;
  font-size: 16px;
  line-height: 2;
  color: #d1e4f5;
`;

export const DetailHeader = styled.span`
  font-family: Matter, sans-serif;
  font-size: 21px;
  font-weight: 500;
  line-height: 1.52;
  //color: #38bfa1;
  color: white;
`;

export const DetailName = styled.span`
  font-family: Matter, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
  color: #d1e4f5;
  opacity: 0.8;
  vertical-align: top;
`;

const detailValueStyles = css`
  margin-left: 8px;
  font-family: Matter, sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
  color: #d1e4f5;
`;

export const DetailValue = styled.span`
  ${detailValueStyles}
`;

export const DetailValuePre = styled.pre`
  ${detailValueStyles}
  margin-bottom: 0;
`;

export const DetailValueDiv = styled.div`
  ${detailValueStyles}
`;
